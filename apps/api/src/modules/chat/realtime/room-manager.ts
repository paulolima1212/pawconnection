import { Injectable } from '@nestjs/common';
import type { WebSocket } from 'ws';

export type SocketMeta = {
  socket: WebSocket;
  userId: string;
  conversationIds: Set<string>;
};

@Injectable()
export class RoomManager {
  private readonly byUser = new Map<string, Set<WebSocket>>();
  private readonly byConversation = new Map<string, Set<WebSocket>>();
  private readonly meta = new WeakMap<WebSocket, SocketMeta>();

  register(socket: WebSocket, userId: string): void {
    this.meta.set(socket, { socket, userId, conversationIds: new Set() });
    let userSockets = this.byUser.get(userId);
    if (!userSockets) {
      userSockets = new Set();
      this.byUser.set(userId, userSockets);
    }
    userSockets.add(socket);
  }

  unregister(socket: WebSocket): SocketMeta | undefined {
    const info = this.meta.get(socket);
    if (!info) return undefined;
    this.meta.delete(socket);
    this.byUser.get(info.userId)?.delete(socket);
    for (const conversationId of info.conversationIds) {
      this.byConversation.get(conversationId)?.delete(socket);
    }
    return info;
  }

  joinConversation(socket: WebSocket, conversationId: string): void {
    const info = this.meta.get(socket);
    if (!info) return;
    info.conversationIds.add(conversationId);
    let set = this.byConversation.get(conversationId);
    if (!set) {
      set = new Set();
      this.byConversation.set(conversationId, set);
    }
    set.add(socket);
  }

  leaveConversation(socket: WebSocket, conversationId: string): void {
    const info = this.meta.get(socket);
    if (!info) return;
    info.conversationIds.delete(conversationId);
    this.byConversation.get(conversationId)?.delete(socket);
  }

  broadcastToConversation(
    conversationId: string,
    payload: unknown,
    except?: WebSocket,
  ): void {
    const set = this.byConversation.get(conversationId);
    if (!set) return;
    const data = JSON.stringify(payload);
    for (const socket of set) {
      if (socket === except) continue;
      if (socket.readyState === socket.OPEN) {
        socket.send(data);
      }
    }
  }

  broadcastToUser(userId: string, payload: unknown): void {
    const set = this.byUser.get(userId);
    if (!set) return;
    const data = JSON.stringify(payload);
    for (const socket of set) {
      if (socket.readyState === socket.OPEN) {
        socket.send(data);
      }
    }
  }

  getUserId(socket: WebSocket): string | undefined {
    return this.meta.get(socket)?.userId;
  }

  hasActiveSockets(userId: string): boolean {
    const set = this.byUser.get(userId);
    return Boolean(set && set.size > 0);
  }
}
