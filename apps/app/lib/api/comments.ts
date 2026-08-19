import { apiRequest } from '@/lib/api/client';
import type {
  CommentApi,
  CommentRepliesPageApi,
  CommentTreePageApi,
  PostCommentCountApi,
} from '@/lib/api/types';

export type ListCommentsParams = {
  limit?: number;
  cursor?: string | null;
  order?: 'newest' | 'oldest';
};

export function listPostComments(postId: string, params?: ListCommentsParams) {
  const query = new URLSearchParams();
  if (params?.limit != null) query.set('limit', String(params.limit));
  if (params?.cursor) query.set('cursor', params.cursor);
  if (params?.order) query.set('order', params.order);
  const qs = query.toString();
  return apiRequest<CommentTreePageApi>(
    `/posts/${postId}/comments${qs ? `?${qs}` : ''}`,
  );
}

export function countPostComments(postId: string) {
  return apiRequest<PostCommentCountApi>(`/posts/${postId}/comments/count`);
}

export function createPostComment(postId: string, content: string) {
  return apiRequest<CommentApi>(`/posts/${postId}/comments`, {
    method: 'POST',
    body: { content },
  });
}

export function replyToComment(commentId: string, content: string) {
  return apiRequest<CommentApi>(`/comments/${commentId}/replies`, {
    method: 'POST',
    body: { content },
  });
}

export function updateComment(commentId: string, content: string) {
  return apiRequest<CommentApi>(`/comments/${commentId}`, {
    method: 'PUT',
    body: { content },
  });
}

export function deleteComment(commentId: string) {
  return apiRequest<{ id: string; status: string }>(`/comments/${commentId}`, {
    method: 'DELETE',
  });
}

export function listCommentReplies(commentId: string, params?: ListCommentsParams) {
  const query = new URLSearchParams();
  if (params?.limit != null) query.set('limit', String(params.limit));
  if (params?.cursor) query.set('cursor', params.cursor);
  if (params?.order) query.set('order', params.order);
  const qs = query.toString();
  return apiRequest<CommentRepliesPageApi>(
    `/comments/${commentId}/replies${qs ? `?${qs}` : ''}`,
  );
}
