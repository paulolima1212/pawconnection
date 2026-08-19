import { randomUUID } from 'crypto';
import { EventMetadata } from '../../../../shared/events/domain-event';
import { ConversationStatus } from '../conversation-status';
import { canonicalParticipantPair } from '../participant-pair';
import { ConversationCreatedEvent } from '../events/chat-events';

export interface ConversationState {
  id: string;
  participantOneId: string;
  participantTwoId: string;
  status: ConversationStatus;
  lastMessageId: string | null;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Conversation {
  private readonly _events: unknown[] = [];

  private constructor(private state: ConversationState) {}

  get id(): string {
    return this.state.id;
  }
  get participantOneId(): string {
    return this.state.participantOneId;
  }
  get participantTwoId(): string {
    return this.state.participantTwoId;
  }
  get status(): ConversationStatus {
    return this.state.status;
  }
  get lastMessageId(): string | null {
    return this.state.lastMessageId;
  }
  get lastMessageAt(): Date | null {
    return this.state.lastMessageAt;
  }
  get createdAt(): Date {
    return this.state.createdAt;
  }
  get updatedAt(): Date {
    return this.state.updatedAt;
  }

  static create(participantA: string, participantB: string, metadata: EventMetadata): Conversation {
    const pair = canonicalParticipantPair(participantA, participantB);
    const now = new Date();
    const conversation = new Conversation({
      id: randomUUID(),
      ...pair,
      status: ConversationStatus.ACTIVE,
      lastMessageId: null,
      lastMessageAt: null,
      createdAt: now,
      updatedAt: now,
    });
    conversation.record(
      new ConversationCreatedEvent(
        conversation.id,
        {
          conversationId: conversation.id,
          participantOneId: conversation.participantOneId,
          participantTwoId: conversation.participantTwoId,
        },
        metadata,
      ),
    );
    return conversation;
  }

  static restore(state: ConversationState): Conversation {
    return new Conversation({ ...state });
  }

  toState(): ConversationState {
    return { ...this.state };
  }

  touchLastMessage(messageId: string, at: Date): void {
    this.state = {
      ...this.state,
      lastMessageId: messageId,
      lastMessageAt: at,
      updatedAt: at,
    };
  }

  pullEvents(): import('../../../../shared/events/domain-event').DomainEvent[] {
    return this._events.splice(0) as import('../../../../shared/events/domain-event').DomainEvent[];
  }

  private record(event: import('../../../../shared/events/domain-event').DomainEvent): void {
    this._events.push(event);
  }
}
