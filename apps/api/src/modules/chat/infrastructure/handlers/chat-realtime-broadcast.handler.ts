import { Inject, Injectable, Logger } from '@nestjs/common';
import { DomainEvent, serializeEvent } from '../../../../shared/events/domain-event';
import { IEventHandler } from '../../../../shared/events/event-bus';
import { toMessageResponse } from '../../application/chat.mapper';
import { CHAT_EVENTS } from '../../domain/events/chat-events';
import {
  CHAT_REPOSITORY,
  IChatRepository,
} from '../../domain/repositories/chat.repository';
import { ChatRealtimeService } from '../../realtime/chat-realtime.service';

@Injectable()
export class ChatRealtimeBroadcastHandler implements IEventHandler {
  readonly handlerName = 'ChatRealtimeBroadcastHandler';
  private readonly logger = new Logger(ChatRealtimeBroadcastHandler.name);

  constructor(
    private readonly realtime: ChatRealtimeService,
    @Inject(CHAT_REPOSITORY) private readonly repo: IChatRepository,
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    const payload = event.payload as Record<string, unknown>;

    switch (event.eventType) {
      case CHAT_EVENTS.MESSAGE_SENT: {
        const messageId = payload.messageId as string;
        const conversationId = payload.conversationId as string;
        const senderId = payload.senderId as string;
        const recipientId = payload.recipientId as string;

        const [forSender, forRecipient] = await Promise.all([
          this.repo.findMessageReadModelById(messageId, senderId),
          this.repo.findMessageReadModelById(messageId, recipientId),
        ]);

        if (forSender) {
          this.realtime.emitToUser(senderId, {
            type: 'message_ack',
            message: toMessageResponse(forSender),
          });
        }
        if (forRecipient) {
          this.realtime.emitToUser(recipientId, {
            type: 'new_message',
            message: toMessageResponse(forRecipient),
          });
          this.realtime.emitToConversation(conversationId, {
            type: 'new_message',
            message: toMessageResponse(forRecipient),
          });
        }
        this.realtime.emitToUser(recipientId, {
          type: 'conversation_updated',
          conversationId,
        });
        break;
      }
      case CHAT_EVENTS.MESSAGE_UPDATED: {
        const messageId = payload.messageId as string;
        const conversationId = payload.conversationId as string;
        const conversation = await this.repo.findConversationById(conversationId);
        if (!conversation) break;
        const state = conversation.toState();
        const participants = [state.participantOneId, state.participantTwoId];
        const activity = {
          kind: 'reaction' as const,
          reactionChange: payload.reactionChange as 'added' | 'removed' | 'changed',
          actorUserId: payload.actorUserId as string,
          actorName: payload.actorName as string,
          messageOwnerId: payload.messageOwnerId as string,
          emoji: payload.emoji as string,
        };
        for (const userId of participants) {
          const model = await this.repo.findMessageReadModelById(messageId, userId);
          if (!model) continue;
          this.realtime.emitToUser(userId, {
            type: 'message_updated',
            message: toMessageResponse(model),
            activity,
          });
        }
        for (const userId of participants) {
          this.realtime.emitToUser(userId, {
            type: 'conversation_updated',
            conversationId,
          });
        }
        break;
      }
      case CHAT_EVENTS.MESSAGE_READ:
        this.realtime.emitToConversation(payload.conversationId as string, {
          type: 'message_read',
          ...payload,
        });
        this.realtime.emitToUser(payload.readerId as string, {
          type: 'conversation_updated',
          conversationId: payload.conversationId,
        });
        break;
      case CHAT_EVENTS.MESSAGE_EDITED:
      case CHAT_EVENTS.MESSAGE_DELETED:
        this.realtime.emitToConversation(payload.conversationId as string, {
          type: event.eventType,
          ...payload,
        });
        break;
      case CHAT_EVENTS.CONVERSATION_CREATED:
        this.realtime.emitToUser(payload.participantOneId as string, {
          type: 'conversation_updated',
          conversationId: payload.conversationId,
        });
        this.realtime.emitToUser(payload.participantTwoId as string, {
          type: 'conversation_updated',
          conversationId: payload.conversationId,
        });
        break;
      case CHAT_EVENTS.USER_ONLINE:
        this.logger.debug(serializeEvent(event));
        break;
      case CHAT_EVENTS.USER_OFFLINE:
        this.logger.debug(serializeEvent(event));
        break;
      default:
        break;
    }
  }
}
