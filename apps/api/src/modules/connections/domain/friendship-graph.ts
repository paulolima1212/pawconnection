import {
  FriendRequestPolicyValue,
  FriendsListVisibilityValue,
  PostVisibilityValue,
} from '../../../shared/domain/types';

export function canonicalUserPair(
  a: string,
  b: string,
): {
  userLowId: string;
  userHighId: string;
} {
  return a < b
    ? { userLowId: a, userHighId: b }
    : { userLowId: b, userHighId: a };
}

export function otherParticipant(
  row: { senderId: string; recipientId: string },
  userId: string,
): string {
  return row.senderId === userId ? row.recipientId : row.senderId;
}

export function mutualFriendIds(
  friendsOfA: string[],
  friendsOfB: string[],
): string[] {
  const theirs = new Set(friendsOfB);
  return friendsOfA.filter((id) => theirs.has(id));
}

export type FriendSuggestion = {
  userId: string;
  mutualFriendIds: string[];
  sameBreed: boolean;
  distanceKm: number | null;
};

export function rankFriendSuggestions(
  items: FriendSuggestion[],
): FriendSuggestion[] {
  return [...items].sort((a, b) => {
    const byMutual = b.mutualFriendIds.length - a.mutualFriendIds.length;
    if (byMutual !== 0) return byMutual;
    if (a.sameBreed !== b.sameBreed) return a.sameBreed ? -1 : 1;
    const distA = a.distanceKm ?? Number.POSITIVE_INFINITY;
    const distB = b.distanceKm ?? Number.POSITIVE_INFINITY;
    return distA - distB;
  });
}

export function canSendFriendRequest(input: {
  policy: FriendRequestPolicyValue;
  mutualFriendCount: number;
}): boolean {
  if (input.policy === 'nobody') return false;
  if (input.policy === 'friends_of_friends') return input.mutualFriendCount > 0;
  return true;
}

export function canViewFriendsList(input: {
  visibility: FriendsListVisibilityValue;
  viewerId: string;
  ownerId: string;
  viewerIsFriend: boolean;
}): boolean {
  if (input.viewerId === input.ownerId) return true;
  if (input.visibility === 'everyone') return true;
  if (input.visibility === 'friends') return input.viewerIsFriend;
  return false;
}

export function canViewPost(input: {
  visibility: PostVisibilityValue;
  viewerId: string;
  authorId: string;
  viewerIsFriend: boolean;
  blocked: boolean;
}): boolean {
  if (input.blocked) return false;
  if (input.viewerId === input.authorId) return true;
  if (input.visibility === 'private') return false;
  if (input.visibility === 'friends') return input.viewerIsFriend;
  return true;
}

export function paginateById<T extends { id: string }>(
  items: T[],
  cursor: string | null,
  limit: number,
): { items: T[]; nextCursor: string | null; hasMore: boolean } {
  const start = cursor
    ? Math.max(items.findIndex((item) => item.id === cursor) + 1, 0)
    : 0;
  const page = items.slice(start, start + limit);
  const hasMore = start + limit < items.length;
  return {
    items: page,
    nextCursor: hasMore && page.length ? page[page.length - 1].id : null,
    hasMore,
  };
}
