import { randomUUID } from 'crypto';
import { EventMetadata } from '../../../../shared/events/domain-event';
import { ForbiddenError, ValidationError } from '../../../../shared/domain/result';
import { MessageType } from '../message-type';
import { MessageStatus, isMessageVisible } from '../message-status';
import { MessageContent } from '../value-objects/message-content.vo';
import {
  MessageDeletedEvent,
  MessageEditedEvent,
  MessageSentEvent,
} from '../events/chat-events';

export interface MessageState {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  clientMessageId: string | null;
  replyToMessageId: string | null;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class Message {
  private readonly _events: unknown[] = [];

  private constructor(private state: MessageState) {}

  get id(): string {
    return this.state.id;
  }
  get conversationId(): string {
    return this.state.conversationId;
  }
  get senderId(): string {
    return this.state.senderId;
  }
  get content(): string {
    return this.state.content;
  }
  get type(): MessageType {
    return this.state.type;
  }
  get status(): MessageStatus {
    return this.state.status;
  }
  get clientMessageId(): string | null {
    return this.state.clientMessageId;
  }
  get replyToMessageId(): string | null {
    return this.state.replyToMessageId;
  }
  get readAt(): Date | null {
    return this.state.readAt;
  }
  get createdAt(): Date {
    return this.state.createdAt;
  }
  get updatedAt(): Date {
    return this.state.updatedAt;
  }
  get deletedAt(): Date | null {
    return this.state.deletedAt;
  }

  static createNew(params: {
    conversationId: string;
    senderId: string;
    recipientId: string;
    rawContent: string;
    type?: MessageType;
    clientMessageId?: string | null;
    replyToMessageId?: string | null;
    metadata: EventMetadata;
  }): Message {
    const content = MessageContent.create(params.rawContent);
    const now = new Date();
    const message = new Message({
      id: randomUUID(),
      conversationId: params.conversationId,
      senderId: params.senderId,
      content: content.value,
      type: params.type ?? MessageType.TEXT,
      status: MessageStatus.SENT,
      clientMessageId: params.clientMessageId?.trim() || null,
      replyToMessageId: params.replyToMessageId?.trim() || null,
      readAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
    message.record(
      new MessageSentEvent(
        message.id,
        {
          messageId: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          recipientId: params.recipientId,
          content: message.content,
          type: message.type,
          clientMessageId: message.clientMessageId,
          replyToMessageId: message.replyToMessageId,
        },
        params.metadata,
      ),
    );
    return message;
  }

  static restore(state: MessageState): Message {
    return new Message({ ...state });
  }

  toState(): MessageState {
    return { ...this.state };
  }

  edit(rawContent: string, editorId: string, metadata: EventMetadata): void {
    if (this.state.senderId !== editorId) {
      throw new ForbiddenError('Only the author can edit this message');
    }
    if (!isMessageVisible(this.state.status)) {
      throw new ValidationError('Deleted messages cannot be edited');
    }
    const content = MessageContent.create(rawContent);
    const now = new Date();
    this.state = {
      ...this.state,
      content: content.value,
      status: MessageStatus.SENT,
      updatedAt: now,
    };
    this.record(
      new MessageEditedEvent(
        this.id,
        {
          messageId: this.id,
          conversationId: this.conversationId,
          content: this.content,
        },
        metadata,
      ),
    );
  }

  softDelete(deleterId: string, metadata: EventMetadata): void {
    if (this.state.senderId !== deleterId) {
      throw new ForbiddenError('Only the author can delete this message');
    }
    if (this.state.status === MessageStatus.DELETED) return;
    const now = new Date();
    this.state = {
      ...this.state,
      status: MessageStatus.DELETED,
      deletedAt: now,
      updatedAt: now,
      content: '',
    };
    this.record(
      new MessageDeletedEvent(
        this.id,
        {
          messageId: this.id,
          conversationId: this.conversationId,
          senderId: this.senderId,
        },
        metadata,
      ),
    );
  }

  markDelivered(): void {
    if (this.state.status === MessageStatus.SENT) {
      this.state = { ...this.state, status: MessageStatus.DELIVERED };
    }
  }

  markRead(readAt = new Date()): void {
    if (this.state.readAt) return;
    this.state = {
      ...this.state,
      readAt,
      status: MessageStatus.READ,
      updatedAt: readAt,
    };
  }

  pullEvents(): import('../../../../shared/events/domain-event').DomainEvent[] {
    return this._events.splice(0) as import('../../../../shared/events/domain-event').DomainEvent[];
  }

  private record(event: import('../../../../shared/events/domain-event').DomainEvent): void {
    this._events.push(event);
  }
}
