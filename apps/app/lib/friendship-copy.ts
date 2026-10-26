export const FRIENDSHIP_EMPTY = {
  friends: 'No friends found.',
  requests: "You don't have any friend requests yet.",
  suggestions: 'No suggestions available right now.',
} as const;

export const FRIENDSHIP_ERRORS = {
  friends: "We couldn't load your friends. Try again.",
  requests: "We couldn't load your friend requests. Try again.",
  suggestions: "We couldn't load suggestions. Try again.",
} as const;

export function friendSubtitle(petName?: string | null, breed?: string | null): string {
  const pet = petName?.trim();
  const kind = breed?.trim();
  if (pet && kind) return `${pet} • ${kind}`;
  return pet || kind || 'Pet parent';
}

export function mutualFriendsLabel(count: number): string {
  if (count === 1) return '1 mutual friend';
  return `${count} mutual friends`;
}
