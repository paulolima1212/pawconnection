import { apiRequest } from '@/lib/api/client';
import type { ProfileConnection } from '@/lib/profile-connection';
import type { InboxRequestApi } from '@/lib/api/types';

export type { InboxRequestApi };

export function listInboxRequests(params?: {
  type?: 'romance' | 'friendship' | 'request';
  direction?: 'incoming' | 'outgoing';
}) {
  const query = new URLSearchParams();
  if (params?.type) query.set('type', params.type);
  if (params?.direction) query.set('direction', params.direction);
  const qs = query.toString();
  return apiRequest<InboxRequestApi[]>(`/inbox/requests${qs ? `?${qs}` : ''}`);
}

export function acceptInboxRequest(id: string) {
  return apiRequest(`/inbox/requests/${id}/accept`, { method: 'POST' });
}

export function rejectInboxRequest(id: string) {
  return apiRequest(`/inbox/requests/${id}/reject`, { method: 'POST' });
}

export function getConnectionWithUser(userId: string) {
  return apiRequest<ProfileConnection>(`/inbox/connection/${userId}`);
}

export function createConnectionRequest(recipientId: string, lookingFor: string) {
  return apiRequest<InboxRequestApi>('/inbox/requests', {
    method: 'POST',
    body: { recipientId, lookingFor },
  });
}

export type FriendUserApi = {
  id: string;
  fullName: string;
  handle: string;
  photoUrl?: string | null;
  petPhotoUrl?: string | null;
  petName?: string | null;
  petBreed?: string | null;
  petAge?: number | null;
  location?: string | null;
};

export type FriendCardApi = {
  id: string;
  user: FriendUserApi;
  mutualFriendCount: number;
};

export type FriendPageApi = {
  items: FriendCardApi[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type FriendSuggestionApi = {
  user: FriendUserApi;
  mutualFriendCount: number;
  sameBreed: boolean;
  distanceKm: number | null;
  livesNearby: boolean;
};

export type FriendshipPrivacyApi = {
  friendRequestPolicy: 'everyone' | 'friends_of_friends' | 'nobody';
  friendsListVisibility: 'everyone' | 'friends' | 'only_me';
  defaultPostVisibility: 'public' | 'friends' | 'private';
};

export function cancelInboxRequest(id: string) {
  return apiRequest(`/inbox/requests/${id}/cancel`, { method: 'POST' });
}

export function removeFriend(userId: string) {
  return apiRequest<{ removed: boolean }>(`/inbox/friends/${userId}`, { method: 'DELETE' });
}

export function listFriends(params?: { cursor?: string | null; q?: string; userId?: string }) {
  const query = new URLSearchParams();
  if (params?.cursor) query.set('cursor', params.cursor);
  if (params?.q) query.set('q', params.q);
  if (params?.userId) query.set('userId', params.userId);
  const qs = query.toString();
  return apiRequest<FriendPageApi>(`/inbox/friends${qs ? `?${qs}` : ''}`);
}

export function listMutualFriends(userId: string) {
  return apiRequest<{
    total: number;
    items: FriendUserApi[];
    nextCursor: string | null;
    hasMore: boolean;
  }>(`/inbox/friends/${userId}/mutual`);
}

export function listFriendSuggestions() {
  return apiRequest<FriendSuggestionApi[]>('/inbox/suggestions');
}

export function getFriendshipPrivacy() {
  return apiRequest<FriendshipPrivacyApi>('/inbox/privacy');
}

export function updateFriendshipPrivacy(patch: Partial<FriendshipPrivacyApi>) {
  return apiRequest<FriendshipPrivacyApi>('/inbox/privacy', { method: 'PATCH', body: patch });
}
