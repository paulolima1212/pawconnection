import { UserSummary } from '../../../shared/domain/types';
import { CommentReadModel } from '../domain/repositories/comment.repository';
import { CommentStatus } from '../domain/comment-status';

const DELETED_PLACEHOLDER = '[deleted]';

export interface CommentResponse {
  id: string;
  postId: string;
  authorId: string;
  parentCommentId: string | null;
  content: string;
  status: CommentStatus;
  edited: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  replyCount: number;
  author: UserSummary | null;
}

export interface CommentTree extends CommentResponse {
  replies: CommentResponse[];
  hasMoreReplies: boolean;
}

/**
 * Maps a persisted read model to the public response shape. Deleted comments are
 * returned as tombstones ([deleted], no author) so threads stay intact without
 * leaking the original content.
 */
export function toCommentResponse(model: CommentReadModel): CommentResponse {
  const deleted = model.status === CommentStatus.DELETED;
  return {
    id: model.id,
    postId: model.postId,
    authorId: model.authorId,
    parentCommentId: model.parentCommentId,
    content: deleted ? DELETED_PLACEHOLDER : model.content,
    status: model.status,
    edited: model.status === CommentStatus.EDITED,
    deleted,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
    replyCount: model.replyCount,
    author: deleted ? null : model.author,
  };
}

export function toCommentTree(
  model: CommentReadModel,
  replies: CommentReadModel[],
): CommentTree {
  const mappedReplies = replies.map(toCommentResponse);
  return {
    ...toCommentResponse(model),
    replies: mappedReplies,
    hasMoreReplies: model.replyCount > mappedReplies.length,
  };
}
