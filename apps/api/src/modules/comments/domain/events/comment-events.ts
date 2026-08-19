import { BaseDomainEvent, EventMetadata } from '../../../../shared/events/domain-event';
import { CommentStatus } from '../comment-status';

/** Centralized event-type names. Stable strings used for routing & transports. */
export const COMMENT_EVENTS = {
  CREATED: 'comment.created',
  EDITED: 'comment.edited',
  DELETED: 'comment.deleted',
  REPLY_CREATED: 'comment.reply_created',
  LIKED: 'comment.liked',
  REPORTED: 'comment.reported',
} as const;

export interface CommentCreatedPayload {
  commentId: string;
  postId: string;
  authorId: string;
  parentCommentId: string | null;
  contentLength: number;
}

export class CommentCreatedEvent extends BaseDomainEvent<CommentCreatedPayload> {
  readonly eventType = COMMENT_EVENTS.CREATED;
  constructor(payload: CommentCreatedPayload, metadata?: EventMetadata) {
    super(payload.commentId, payload, { source: 'comments', ...metadata });
  }
}

export interface ReplyCreatedPayload {
  commentId: string;
  postId: string;
  authorId: string;
  parentCommentId: string;
  parentAuthorId: string;
  depth: number;
}

export class ReplyCreatedEvent extends BaseDomainEvent<ReplyCreatedPayload> {
  readonly eventType = COMMENT_EVENTS.REPLY_CREATED;
  constructor(payload: ReplyCreatedPayload, metadata?: EventMetadata) {
    super(payload.commentId, payload, { source: 'comments', ...metadata });
  }
}

export interface CommentEditedPayload {
  commentId: string;
  postId: string;
  authorId: string;
  editedAt: Date;
}

export class CommentEditedEvent extends BaseDomainEvent<CommentEditedPayload> {
  readonly eventType = COMMENT_EVENTS.EDITED;
  constructor(payload: CommentEditedPayload, metadata?: EventMetadata) {
    super(payload.commentId, payload, { source: 'comments', ...metadata });
  }
}

export interface CommentDeletedPayload {
  commentId: string;
  postId: string;
  authorId: string;
  deletedBy: string;
  byModerator: boolean;
  previousStatus: CommentStatus;
}

export class CommentDeletedEvent extends BaseDomainEvent<CommentDeletedPayload> {
  readonly eventType = COMMENT_EVENTS.DELETED;
  constructor(payload: CommentDeletedPayload, metadata?: EventMetadata) {
    super(payload.commentId, payload, { source: 'comments', ...metadata });
  }
}

// --- Future-facing events (declared now so handlers/analytics can be wired
// incrementally without reshaping the contract later) ---

export interface CommentLikedPayload {
  commentId: string;
  postId: string;
  likedBy: string;
}

export class CommentLikedEvent extends BaseDomainEvent<CommentLikedPayload> {
  readonly eventType = COMMENT_EVENTS.LIKED;
  constructor(payload: CommentLikedPayload, metadata?: EventMetadata) {
    super(payload.commentId, payload, { source: 'comments', ...metadata });
  }
}

export interface CommentReportedPayload {
  commentId: string;
  postId: string;
  reportedBy: string;
  reason: string;
}

export class CommentReportedEvent extends BaseDomainEvent<CommentReportedPayload> {
  readonly eventType = COMMENT_EVENTS.REPORTED;
  constructor(payload: CommentReportedPayload, metadata?: EventMetadata) {
    super(payload.commentId, payload, { source: 'comments', ...metadata });
  }
}
