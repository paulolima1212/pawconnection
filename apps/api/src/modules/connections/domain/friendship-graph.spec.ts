import {
  canSendFriendRequest,
  canViewFriendsList,
  canViewPost,
  canonicalUserPair,
  mutualFriendIds,
  paginateById,
  rankFriendSuggestions,
} from './friendship-graph';

describe('canonicalUserPair', () => {
  it('orders the pair the same way regardless of direction', () => {
    expect(canonicalUserPair('b', 'a')).toEqual(canonicalUserPair('a', 'b'));
    expect(canonicalUserPair('b', 'a')).toEqual({
      userLowId: 'a',
      userHighId: 'b',
    });
  });
});

describe('mutualFriendIds', () => {
  it('Given A friends with B and B friends with C, B is mutual for A and C', () => {
    expect(mutualFriendIds(['b', 'd'], ['b', 'e'])).toEqual(['b']);
  });
});

describe('rankFriendSuggestions', () => {
  it('ranks mutual friends ahead of breed and distance', () => {
    const ranked = rankFriendSuggestions([
      { userId: 'far', mutualFriendIds: [], sameBreed: true, distanceKm: 1 },
      {
        userId: 'close',
        mutualFriendIds: ['m1', 'm2'],
        sameBreed: false,
        distanceKm: 40,
      },
      {
        userId: 'one',
        mutualFriendIds: ['m1'],
        sameBreed: true,
        distanceKm: 2,
      },
    ]);
    expect(ranked.map((item) => item.userId)).toEqual(['close', 'one', 'far']);
  });
});

describe('friendship privacy', () => {
  it('blocks requests when the policy is nobody or there is no mutual friend', () => {
    expect(
      canSendFriendRequest({ policy: 'nobody', mutualFriendCount: 3 }),
    ).toBe(false);
    expect(
      canSendFriendRequest({
        policy: 'friends_of_friends',
        mutualFriendCount: 0,
      }),
    ).toBe(false);
    expect(
      canSendFriendRequest({
        policy: 'friends_of_friends',
        mutualFriendCount: 1,
      }),
    ).toBe(true);
    expect(
      canSendFriendRequest({ policy: 'everyone', mutualFriendCount: 0 }),
    ).toBe(true);
  });

  it('hides a friends list that is only for the owner or their friends', () => {
    expect(
      canViewFriendsList({
        visibility: 'only_me',
        viewerId: 'a',
        ownerId: 'b',
        viewerIsFriend: true,
      }),
    ).toBe(false);
    expect(
      canViewFriendsList({
        visibility: 'friends',
        viewerId: 'a',
        ownerId: 'b',
        viewerIsFriend: false,
      }),
    ).toBe(false);
    expect(
      canViewFriendsList({
        visibility: 'friends',
        viewerId: 'a',
        ownerId: 'b',
        viewerIsFriend: true,
      }),
    ).toBe(true);
  });
});

describe('canViewPost', () => {
  it('allows friends to see friends-only posts and denies everyone else', () => {
    expect(
      canViewPost({
        visibility: 'friends',
        viewerId: 'friend',
        authorId: 'author',
        viewerIsFriend: true,
        blocked: false,
      }),
    ).toBe(true);
    expect(
      canViewPost({
        visibility: 'friends',
        viewerId: 'stranger',
        authorId: 'author',
        viewerIsFriend: false,
        blocked: false,
      }),
    ).toBe(false);
    expect(
      canViewPost({
        visibility: 'public',
        viewerId: 'stranger',
        authorId: 'author',
        viewerIsFriend: false,
        blocked: true,
      }),
    ).toBe(false);
    expect(
      canViewPost({
        visibility: 'private',
        viewerId: 'author',
        authorId: 'author',
        viewerIsFriend: false,
        blocked: false,
      }),
    ).toBe(true);
  });
});

describe('paginateById', () => {
  const items = [{ id: '1' }, { id: '2' }, { id: '3' }];

  it('returns a page and a cursor when more friends remain', () => {
    expect(paginateById(items, null, 2)).toEqual({
      items: [{ id: '1' }, { id: '2' }],
      nextCursor: '2',
      hasMore: true,
    });
    expect(paginateById(items, '2', 2)).toEqual({
      items: [{ id: '3' }],
      nextCursor: null,
      hasMore: false,
    });
  });
});
