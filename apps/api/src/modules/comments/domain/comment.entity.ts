import { randomUUID } from 'crypto';
import { DomainEvent, EventMetadata } from '../../../shared/events/domain-event';
import { ForbiddenError, ValidationError } from '../../../shared/domain/result';
import { CommentStatus } from './comment-status';
import { CommentContent } from './value-objects/comment-content.vo';
import {
  CommentCreatedEvent,
  CommentDeletedEvent,
  CommentEditedEvent,
  ReplyCreatedEvent,
} from './events/comment-events';

export interface CommentState {
  id: string;
  postId: string;
  authorId: string;
  parentCommentId: string | null;
  content: string;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface CreateReplyContext {
  parentCommentId: string;
  parentAuthorId: string;
  /** Depth of the parent (0 = top level). The new reply will be parentDepth + 1. */
  parentDepth: number;
}

/**
 * Comment aggregate root.
 *
 * All state transitions go through methods that enforce the domain invariants
 * and record domain events. Persistence and transport are not the aggregate's
 * concern: it only mutates its own state and appends events, which the
 * application layer pulls and publishes after the transaction commits.
 */
export class Comment {
  private readonly _events: DomainEvent[] = [];

  private constructor(private state: CommentState) {}

  // --- Identity & read accessors -------------------------------------------

  get id(): string {
    return this.state.id;
  }
  get postId(): string {
    return this.state.postId;
  }
  get authorId(): string {
    return this.state.authorId;
  }
  get parentCommentId(): string | null {
    return this.state.parentCommentId;
  }
  get content(): string {
    return this.state.content;
  }
  get status(): CommentStatus {
    return this.state.status;
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
  get isReply(): boolean {
    return this.state.parentCommentId !== null;
  }
  get isDeleted(): boolean {
    return this.state.status === CommentStatus.DELETED;
  }

  /** Plain snapshot for repositories. */
  toState(): CommentState {
    return { ...this.state };
  }

  // --- Domain events --------------------------------------------------------

  /** Returns recorded events and clears the internal buffer. */
  pullEvents(): DomainEvent[] {
    const events = [...this._events];
    this._events.length = 0;
    return events;
  }

  private record(event: DomainEvent): void {
    this._events.push(event);
  }

  // --- Factories ------------------------------------------------------------

  /** Rehydrate an aggregate from persistence without emitting events. */
  static restore(state: CommentState): Comment {
    return new Comment({ ...state });
  }

  /** Create a new top-level comment on a post. */
  static createTopLevel(input: {
    postId: string;
    authorId: string;
    content: CommentContent;
    metadata?: EventMetadata;
  }): Comment {
    const now = new Date();
    const comment = new Comment({
      id: randomUUID(),
      postId: input.postId,
      authorId: input.authorId,
      parentCommentId: null,
      content: input.content.value,
      status: CommentStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    comment.record(
      new CommentCreatedEvent(
        {
          commentId: comment.id,
          postId: comment.postId,
          authorId: comment.authorId,
          parentCommentId: null,
          contentLength: comment.content.length,
        },
        input.metadata,
      ),
    );
    return comment;
  }

  /** Create a reply to an existing comment. Depth is provided by the caller. */
  static createReply(input: {
    postId: string;
    authorId: string;
    content: CommentContent;
    parent: CreateReplyContext;
    metadata?: EventMetadata;
  }): Comment {
    const now = new Date();
    const depth = input.parent.parentDepth + 1;
    const comment = new Comment({
      id: randomUUID(),
      postId: input.postId,
      authorId: input.authorId,
      parentCommentId: input.parent.parentCommentId,
      content: input.content.value,
      status: CommentStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    comment.record(
      new CommentCreatedEvent(
        {
          commentId: comment.id,
          postId: comment.postId,
          authorId: comment.authorId,
          parentCommentId: comment.parentCommentId,
          contentLength: comment.content.length,
        },
        input.metadata,
      ),
    );
    comment.record(
      new ReplyCreatedEvent(
        {
          commentId: comment.id,
          postId: comment.postId,
          authorId: comment.authorId,
          parentCommentId: input.parent.parentCommentId,
          parentAuthorId: input.parent.parentAuthorId,
          depth,
        },
        input.metadata,
      ),
    );
    return comment;
  }

  // --- Behaviors ------------------------------------------------------------

  /** Edit the content. Only the author may edit, and not once deleted/blocked. */
  edit(newContent: CommentContent, editorId: string, metadata?: EventMetadata): void {
    if (this.state.status === CommentStatus.DELETED) {
      throw new ValidationError('Cannot edit a deleted comment');
    }
    if (this.state.status === CommentStatus.BLOCKED) {
      throw new ForbiddenError('This comment is blocked and cannot be edited');
    }
    if (editorId !== this.state.authorId) {
      throw new ForbiddenError('Only the author can edit this comment');
    }

    if (newContent.value === this.state.content) {
      return; // no-op edit, nothing to emit
    }

    this.state.content = newContent.value;
    this.state.status = CommentStatus.EDITED;
    this.state.updatedAt = new Date();

    this.record(
      new CommentEditedEvent(
        {
          commentId: this.id,
          postId: this.postId,
          authorId: this.authorId,
          editedAt: this.state.updatedAt,
        },
        metadata,
      ),
    );
  }

  /**
   * Soft delete. Allowed for the author or a moderator. Idempotent: deleting an
   * already-deleted comment is a no-op so DELETE stays safe to retry. The row is
   * preserved so existing replies remain in the thread.
   */
  softDelete(
    actorId: string,
    options: { byModerator: boolean },
    metadata?: EventMetadata,
  ): void {
    if (this.state.status === CommentStatus.DELETED) {
      return;
    }
    if (actorId !== this.state.authorId && !options.byModerator) {
      throw new ForbiddenError('You do not have permission to delete this comment');
    }

    const previousStatus = this.state.status;
    const now = new Date();
    this.state.status = CommentStatus.DELETED;
    this.state.deletedAt = now;
    this.state.updatedAt = now;

    this.record(
      new CommentDeletedEvent(
        {
          commentId: this.id,
          postId: this.postId,
          authorId: this.authorId,
          deletedBy: actorId,
          byModerator: options.byModerator,
          previousStatus,
        },
        metadata,
      ),
    );
  }
}
