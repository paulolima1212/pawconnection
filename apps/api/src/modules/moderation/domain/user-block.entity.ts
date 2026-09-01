import { randomUUID } from 'crypto';
import { DomainEvent, EventMetadata } from '../../../shared/events/domain-event';
import { ValidationError } from '../../../shared/domain/result';
import { UserBlockedEvent } from './events/moderation-events';

export interface UserBlockState {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: Date;
}

/**
 * User block aggregate. A blocker hides a blocked user from access,
 * visualization, and interaction in either direction.
 */
export class UserBlock {
  private readonly _events: DomainEvent[] = [];

  private constructor(private state: UserBlockState) {}

  get id(): string {
    return this.state.id;
  }
  get blockerId(): string {
    return this.state.blockerId;
  }
  get blockedId(): string {
    return this.state.blockedId;
  }
  get createdAt(): Date {
    return this.state.createdAt;
  }

  toState(): UserBlockState {
    return { ...this.state };
  }

  pullEvents(): DomainEvent[] {
    const events = [...this._events];
    this._events.length = 0;
    return events;
  }

  static restore(state: UserBlockState): UserBlock {
    return new UserBlock({ ...state });
  }

  static create(input: {
    blockerId: string;
    blockedId: string;
    metadata?: EventMetadata;
  }): UserBlock {
    if (input.blockerId === input.blockedId) {
      throw new ValidationError('You cannot block yourself');
    }

    const block = new UserBlock({
      id: randomUUID(),
      blockerId: input.blockerId,
      blockedId: input.blockedId,
      createdAt: new Date(),
    });

    block._events.push(
      new UserBlockedEvent(
        { blockerId: block.blockerId, blockedId: block.blockedId },
        input.metadata,
      ),
    );
    return block;
  }
}
