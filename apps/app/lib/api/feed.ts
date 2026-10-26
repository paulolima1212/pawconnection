import { apiRequest } from '@/lib/api/client';
import type { FeedPostApi } from '@/lib/api/types';

export type ListFeedPostsParams = {
  radiusKm?: number;
  scope?: 'all' | 'friends' | 'mine';
  q?: string;
  city?: string;
  author?: string;
  petGender?: 'Male' | 'Female' | 'Other';
  petAge?: number;
  petSize?: 'small' | 'medium' | 'large';
};

export function listFeedPosts(params?: ListFeedPostsParams) {
  const query = new URLSearchParams();
  if (params?.radiusKm != null && params.radiusKm > 0) {
    query.set('radiusKm', String(params.radiusKm));
  }
  if (params?.scope && params.scope !== 'all') query.set('scope', params.scope);
  if (params?.q) query.set('q', params.q);
  if (params?.city) query.set('city', params.city);
  if (params?.author) query.set('author', params.author);
  if (params?.petGender) query.set('petGender', params.petGender);
  if (params?.petAge != null && !Number.isNaN(params.petAge)) {
    query.set('petAge', String(params.petAge));
  }
  if (params?.petSize) query.set('petSize', params.petSize);
  const qs = query.toString();
  return apiRequest<FeedPostApi[]>(`/feed/posts${qs ? `?${qs}` : ''}`);
}

export function createFeedPost(
  body: string | undefined,
  imageUrls: string[],
  visibility?: 'public' | 'friends' | 'private',
) {
  return apiRequest<FeedPostApi>('/feed/posts', {
    method: 'POST',
    body: { body, imageUrls, visibility },
  });
}

export function updateFeedPost(
  postId: string,
  body: string | undefined,
  imageUrls: string[],
  visibility?: 'public' | 'friends' | 'private',
) {
  return apiRequest<FeedPostApi>(`/feed/posts/${postId}`, {
    method: 'PATCH',
    body: { body, imageUrls, visibility },
  });
}

export function deleteFeedPost(postId: string) {
  return apiRequest<{ id: string }>(`/feed/posts/${postId}`, {
    method: 'DELETE',
  });
}

export function listFriendsFeed(cursor?: string | null) {
  const query = new URLSearchParams();
  if (cursor) query.set('cursor', cursor);
  const qs = query.toString();
  return apiRequest<{ items: FeedPostApi[]; nextCursor: string | null; hasMore: boolean }>(
    `/feed/friends${qs ? `?${qs}` : ''}`,
  );
}

export function togglePostLike(postId: string) {
  return apiRequest<{ liked: boolean; likeCount: number }>(`/feed/posts/${postId}/like`, {
    method: 'POST',
  });
}
