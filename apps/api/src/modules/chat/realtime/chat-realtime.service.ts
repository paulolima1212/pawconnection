import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HttpAdapterHost } from '@nestjs/core';
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { Duplex } from 'stream';
import { parse } from 'url';
import { PresenceManager } from './presence-manager';
import { RoomManager } from './room-manager';
import { MarkConversationReadUseCase, SendMessageUseCase, ToggleMessageReactionUseCase } from '../application/chat.use-cases';
import { EVENT_BUS, IEventBus } from '../../../shared/events/event-bus';
import { CHAT_EVENTS, UserOfflineEvent, UserOnlineEvent } from '../domain/events/chat-events';
import { Inject } from '@nestjs/common';

const HEARTBEAT_MS = 30_000;

type ClientEvent =
  | {
      type: 'send_message';
      conversationId: string;
      content: string;
      clientMessageId?: string;
      replyToMessageId?: string;
    }
  | { type: 'toggle_reaction'; messageId: string; emoji: string }
  | { type: 'mark_as_read'; conversationId: string }
  | { type: 'typing_start'; conversationId: string }
  | { type: 'typing_stop'; conversationId: string }
  | { type: 'join_conversation'; conversationId: string }
  | { type: 'leave_conversation'; conversationId: string }
  | { type: 'ping' };

@Injectable()
export class ChatRealtimeService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ChatRealtimeService.name);
  private wss?: WebSocketServer;

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly jwt: JwtService,
    private readonly rooms: RoomManager,
    private readonly presence: PresenceManager,
    private readonly sendMessage: SendMessageUseCase,
    private readonly toggleReaction: ToggleMessageReactionUseCase,
    private readonly markRead: MarkConversationReadUseCase,
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
  ) {}

  onApplicationBootstrap(): void {
    const httpServer = this.httpAdapterHost.httpAdapter.getHttpServer();
    this.wss = new WebSocketServer({ noServer: true });

    httpServer.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
      const { pathname, query } = parse(request.url ?? '', true);
      if (pathname !== '/realtime/chat') {
        return;
      }
      this.wss!.handleUpgrade(request, socket, head, (ws) => {
        this.wss!.emit('connection', ws, request, query);
      });
    });

    this.wss.on('connection', (socket: WebSocket, _request: IncomingMessage, query: Record<string, unknown>) => {
      void this.handleConnection(socket, query);
    });

    this.logger.log('Chat WebSocket listening on /realtime/chat');
  }

  private async authenticate(query: Record<string, unknown>): Promise<string | null> {
    const token =
      (typeof query.token === 'string' ? query.token : null) ??
      (Array.isArray(query.token) ? query.token[0] : null);
    if (!token) return null;
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
      return payload.sub ?? null;
    } catch {
      return null;
    }
  }

  private async handleConnection(
    socket: WebSocket,
    query: Record<string, unknown>,
  ): Promise<void> {
    const userId = await this.authenticate(query);
    if (!userId) {
      socket.close(4401, 'Unauthorized');
      return;
    }

    this.rooms.register(socket, userId);
    this.presence.markOnline(userId);
    await this.bus.publish(new UserOnlineEvent(userId, { userId, source: 'chat-ws' }));

    this.rooms.broadcastToUser(userId, { type: 'connected', userId });

    const heartbeat = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.ping();
      }
    }, HEARTBEAT_MS);

    socket.on('message', (raw) => {
      void this.handleClientMessage(socket, userId, raw.toString());
    });

    socket.on('close', () => {
      clearInterval(heartbeat);
      const info = this.rooms.unregister(socket);
      if (info && !this.rooms.hasActiveSockets(info.userId)) {
        this.presence.markOffline(info.userId);
        void this.bus.publish(
          new UserOfflineEvent(info.userId, { userId: info.userId, source: 'chat-ws' }),
        );
      }
    });
  }

  private async handleClientMessage(
    socket: WebSocket,
    userId: string,
    raw: string,
  ): Promise<void> {
    let event: ClientEvent;
    try {
      event = JSON.parse(raw) as ClientEvent;
    } catch {
      return;
    }

    const ctx = { userId, correlationId: `ws-${Date.now()}` };

    try {
      switch (event.type) {
        case 'ping':
          socket.send(JSON.stringify({ type: 'pong' }));
          return;
        case 'join_conversation':
          this.rooms.joinConversation(socket, event.conversationId);
          return;
        case 'leave_conversation':
          this.rooms.leaveConversation(socket, event.conversationId);
          return;
        case 'typing_start':
          this.rooms.broadcastToConversation(event.conversationId, {
            type: 'user_typing',
            conversationId: event.conversationId,
            userId,
            active: true,
          }, socket);
          return;
        case 'typing_stop':
          this.rooms.broadcastToConversation(event.conversationId, {
            type: 'user_typing',
            conversationId: event.conversationId,
            userId,
            active: false,
          }, socket);
          return;
        case 'mark_as_read': {
          const result = await this.markRead.execute(event.conversationId, ctx);
          this.rooms.broadcastToConversation(event.conversationId, {
            type: 'message_read',
            conversationId: event.conversationId,
            readerId: userId,
            marked: result.marked,
          });
          return;
        }
        case 'send_message': {
          await this.sendMessage.execute(
            {
              conversationId: event.conversationId,
              content: event.content,
              clientMessageId: event.clientMessageId,
              replyToMessageId: event.replyToMessageId,
            },
            ctx,
          );
          return;
        }
        case 'toggle_reaction': {
          await this.toggleReaction.execute(event.messageId, event.emoji, ctx);
          return;
        }
        default:
          return;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Request failed';
      socket.send(JSON.stringify({ type: 'error', message }));
    }
  }

  /** Called by domain event handlers to push server events. */
  emitToConversation(conversationId: string, payload: unknown, exceptUserId?: string): void {
    this.rooms.broadcastToConversation(conversationId, payload);
    if (exceptUserId) {
      // broadcastToConversation already sends to all in room; filter by user if needed
    }
  }

  emitToUser(userId: string, payload: unknown): void {
    this.rooms.broadcastToUser(userId, payload);
  }
}
