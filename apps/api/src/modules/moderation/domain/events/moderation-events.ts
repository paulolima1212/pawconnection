import { BaseDomainEvent, EventMetadata } from '../../../../shared/events/domain-event';
import { ReportReason } from '../report-reason';

export const MODERATION_EVENTS = {
  POST_REPORTED: 'moderation.post_reported',
  USER_BLOCKED: 'moderation.user_blocked',
  USER_UNBLOCKED: 'moderation.user_unblocked',
} as const;

export interface PostReportedPayload {
  reportId: string;
  postId: string;
  reporterId: string;
  postAuthorId: string;
  reason: ReportReason;
  details: string | null;
}

export class PostReportedEvent extends BaseDomainEvent<PostReportedPayload> {
  readonly eventType = MODERATION_EVENTS.POST_REPORTED;
  constructor(payload: PostReportedPayload, metadata?: EventMetadata) {
    super(payload.reportId, payload, { source: 'moderation', ...metadata });
  }
}

export interface UserBlockedPayload {
  blockerId: string;
  blockedId: string;
}

export class UserBlockedEvent extends BaseDomainEvent<UserBlockedPayload> {
  readonly eventType = MODERATION_EVENTS.USER_BLOCKED;
  constructor(payload: UserBlockedPayload, metadata?: EventMetadata) {
    super(payload.blockerId, payload, { source: 'moderation', ...metadata });
  }
}

export interface UserUnblockedPayload {
  blockerId: string;
  blockedId: string;
}

export class UserUnblockedEvent extends BaseDomainEvent<UserUnblockedPayload> {
  readonly eventType = MODERATION_EVENTS.USER_UNBLOCKED;
  constructor(payload: UserUnblockedPayload, metadata?: EventMetadata) {
    super(payload.blockerId, payload, { source: 'moderation', ...metadata });
  }
}
