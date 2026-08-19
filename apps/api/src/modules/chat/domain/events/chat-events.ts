import { BaseDomainEvent, EventMetadata } from '../../../../shared/events/domain-event';

export const CHAT_EVENTS = {
  CONVERSATION_CREATED: 'chat.conversation_created',
  MESSAGE_SENT: 'chat.message_sent',
  MESSAGE_DELIVERED: 'chat.message_delivered',
  MESSAGE_READ: 'chat.message_read',
  MESSAGE_EDITED: 'chat.message_edited',
  MESSAGE_DELETED: 'chat.message_deleted',
  MESSAGE_UPDATED: 'chat.message_updated',
  USER_TYPING_STARTED: 'chat.user_typing_started',
  USER_TYPING_STOPPED: 'chat.user_typing_stopped',
  USER_ONLINE: 'chat.user_online',
  USER_OFFLINE: 'chat.user_offline',
} as const;

export type ChatEventType = (typeof CHAT_EVENTS)[keyof typeof CHAT_EVENTS];

export class ConversationCreatedEvent extends BaseDomainEvent<{
  conversationId: string;
  participantOneId: string;
  participantTwoId: string;
}> {
  readonly eventType = CHAT_EVENTS.CONVERSATION_CREATED;
  constructor(conversationId: string, payload: ConversationCreatedEvent['payload'], metadata?: EventMetadata) {
    super(conversationId, payload, metadata);
  }
}

export class MessageSentEvent extends BaseDomainEvent<{
  messageId: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  type: string;
  clientMessageId?: string | null;
  replyToMessageId?: string | null;
}> {
  readonly eventType = CHAT_EVENTS.MESSAGE_SENT;
  constructor(messageId: string, payload: MessageSentEvent['payload'], metadata?: EventMetadata) {
    super(messageId, payload, metadata);
  }
}

export class MessageDeliveredEvent extends BaseDomainEvent<{
  messageId: string;
  conversationId: string;
  recipientId: string;
}> {
  readonly eventType = CHAT_EVENTS.MESSAGE_DELIVERED;
  constructor(messageId: string, payload: MessageDeliveredEvent['payload'], metadata?: EventMetadata) {
    super(messageId, payload, metadata);
  }
}

export class MessageReadEvent extends BaseDomainEvent<{
  conversationId: string;
  readerId: string;
  messageIds: string[];
}> {
  readonly eventType = CHAT_EVENTS.MESSAGE_READ;
  constructor(conversationId: string, payload: MessageReadEvent['payload'], metadata?: EventMetadata) {
    super(conversationId, payload, metadata);
  }
}

export class MessageEditedEvent extends BaseDomainEvent<{
  messageId: string;
  conversationId: string;
  content: string;
}> {
  readonly eventType = CHAT_EVENTS.MESSAGE_EDITED;
  constructor(messageId: string, payload: MessageEditedEvent['payload'], metadata?: EventMetadata) {
    super(messageId, payload, metadata);
  }
}

export class MessageDeletedEvent extends BaseDomainEvent<{
  messageId: string;
  conversationId: string;
  senderId: string;
}> {
  readonly eventType = CHAT_EVENTS.MESSAGE_DELETED;
  constructor(messageId: string, payload: MessageDeletedEvent['payload'], metadata?: EventMetadata) {
    super(messageId, payload, metadata);
  }
}

export class MessageUpdatedEvent extends BaseDomainEvent<{
  messageId: string;
  conversationId: string;
  actorUserId: string;
  actorName: string;
  messageOwnerId: string;
  emoji: string;
  reactionChange: 'added' | 'removed' | 'changed';
}> {
  readonly eventType = CHAT_EVENTS.MESSAGE_UPDATED;
  constructor(messageId: string, payload: MessageUpdatedEvent['payload'], metadata?: EventMetadata) {
    super(messageId, payload, metadata);
  }
}

export class UserTypingStartedEvent extends BaseDomainEvent<{
  conversationId: string;
  userId: string;
}> {
  readonly eventType = CHAT_EVENTS.USER_TYPING_STARTED;
  constructor(conversationId: string, payload: UserTypingStartedEvent['payload'], metadata?: EventMetadata) {
    super(conversationId, payload, metadata);
  }
}

export class UserTypingStoppedEvent extends BaseDomainEvent<{
  conversationId: string;
  userId: string;
}> {
  readonly eventType = CHAT_EVENTS.USER_TYPING_STOPPED;
  constructor(conversationId: string, payload: UserTypingStoppedEvent['payload'], metadata?: EventMetadata) {
    super(conversationId, payload, metadata);
  }
}

export class UserOnlineEvent extends BaseDomainEvent<{ userId: string }> {
  readonly eventType = CHAT_EVENTS.USER_ONLINE;
  constructor(userId: string, metadata?: EventMetadata) {
    super(userId, { userId }, metadata);
  }
}

export class UserOfflineEvent extends BaseDomainEvent<{ userId: string }> {
  readonly eventType = CHAT_EVENTS.USER_OFFLINE;
  constructor(userId: string, metadata?: EventMetadata) {
    super(userId, { userId }, metadata);
  }
}
