import { UserSummary } from '../../../../shared/domain/types';
import { Comment } from '../comment.entity';
import { CommentStatus } from '../comment-status';

export const COMMENT_REPOSITORY = Symbol('COMMENT_REPOSITORY');

export type CommentOrder = 'newest' | 'oldest';

/**
 * Read model for listing. Carries the joined author summary and reply count so
 * the presentation layer never triggers per-comment lookups (no N+1).
 */
export interface CommentReadModel {
  id: string;
  postId: string;
  authorId: string;
  parentCommentId: string | null;
  content: string;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  author: UserSummary | null;
  replyCount: number;
}

export interface CommentPage {
  items: CommentReadModel[];
  /** Opaque cursor for the next page, or null when there are no more rows. */
  nextCursor: string | null;
}

export interface ListCommentsOptions {
  limit: number;
  cursor?: string | null;
  order: CommentOrder;
}

export interface ICommentRepository {
  /** Load the write-side aggregate (no joins). */
  findById(id: string): Promise<Comment | null>;

  /** Load a single comment as a read model (with author + reply count). */
  findReadModelById(id: string): Promise<CommentReadModel | null>;

  /** Persist a brand-new comment. */
  create(comment: Comment): Promise<void>;

  /** Persist mutations on an existing comment (edit / soft delete). */
  update(comment: Comment): Promise<void>;

  /**
   * Distance from the root of the thread (0 = top-level). Bounded walk up the
   * parent chain; returns null if the comment does not exist.
   */
  getDepth(commentId: string): Promise<number | null>;

  /** Cursor-paginated top-level comments for a post. */
  listTopLevel(postId: string, options: ListCommentsOptions): Promise<CommentPage>;

  /** Cursor-paginated replies for a given parent comment. */
  listReplies(
    parentCommentId: string,
    options: ListCommentsOptions,
  ): Promise<CommentPage>;

  /**
   * Load up to `perParent` replies for many parents in a single query, grouped
   * by parent id. Used to hydrate the comment tree preview without N+1.
   */
  previewRepliesFor(
    parentIds: string[],
    perParent: number,
    order: CommentOrder,
  ): Promise<Map<string, CommentReadModel[]>>;

  /** Count of visible comments (active + edited) for a post. */
  countByPost(postId: string): Promise<number>;
}
