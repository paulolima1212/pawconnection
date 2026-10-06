import {
  BaseDomainEvent,
  EventMetadata,
} from '../../../../shared/events/domain-event';

export const FRIENDSHIP_EVENTS = {
  REQUEST_SENT: 'friendship.request_sent',
  REQUEST_ACCEPTED: 'friendship.request_accepted',
  REQUEST_DECLINED: 'friendship.request_declined',
  REQUEST_CANCELLED: 'friendship.request_cancelled',
  REMOVED: 'friendship.removed',
} as const;

export interface FriendshipEventPayload {
  requestId: string;
  actorId: string;
  otherUserId: string;
}

export class FriendRequestSentEvent extends BaseDomainEvent<FriendshipEventPayload> {
  readonly eventType = FRIENDSHIP_EVENTS.REQUEST_SENT;
  constructor(payload: FriendshipEventPayload, metadata?: EventMetadata) {
    super(payload.requestId, payload, { source: 'friendship', ...metadata });
  }
}

export class FriendRequestAcceptedEvent extends BaseDomainEvent<FriendshipEventPayload> {
  readonly eventType = FRIENDSHIP_EVENTS.REQUEST_ACCEPTED;
  constructor(payload: FriendshipEventPayload, metadata?: EventMetadata) {
    super(payload.requestId, payload, { source: 'friendship', ...metadata });
  }
}

export class FriendRequestDeclinedEvent extends BaseDomainEvent<FriendshipEventPayload> {
  readonly eventType = FRIENDSHIP_EVENTS.REQUEST_DECLINED;
  constructor(payload: FriendshipEventPayload, metadata?: EventMetadata) {
    super(payload.requestId, payload, { source: 'friendship', ...metadata });
  }
}

export class FriendRequestCancelledEvent extends BaseDomainEvent<FriendshipEventPayload> {
  readonly eventType = FRIENDSHIP_EVENTS.REQUEST_CANCELLED;
  constructor(payload: FriendshipEventPayload, metadata?: EventMetadata) {
    super(payload.requestId, payload, { source: 'friendship', ...metadata });
  }
}

export class FriendshipRemovedEvent extends BaseDomainEvent<FriendshipEventPayload> {
  readonly eventType = FRIENDSHIP_EVENTS.REMOVED;
  constructor(payload: FriendshipEventPayload, metadata?: EventMetadata) {
    super(payload.requestId, payload, { source: 'friendship', ...metadata });
  }
}
