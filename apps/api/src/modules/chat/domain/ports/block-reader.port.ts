export const CHAT_BLOCK_READER = Symbol('CHAT_BLOCK_READER');

export interface IChatBlockReader {
  /** True if either user has blocked the other. */
  isBlockedBetween(userId: string, otherUserId: string): Promise<boolean>;
  /** True if `blockerId` has blocked `blockedId`. */
  isBlockedBy(blockerId: string, blockedId: string): Promise<boolean>;
  /** User ids hidden from this viewer by a block in either direction. */
  listHiddenUserIds(viewerId: string): Promise<string[]>;
  /** User ids this viewer has blocked. */
  listBlockedByMe(viewerId: string): Promise<string[]>;
  /** User ids who have blocked this viewer. */
  listWhoBlocked(viewerId: string): Promise<string[]>;
}
