export const CHAT_BLOCK_READER = Symbol('CHAT_BLOCK_READER');

export interface IChatBlockReader {
  /** True if either user has blocked the other. */
  isBlockedBetween(userId: string, otherUserId: string): Promise<boolean>;
}
