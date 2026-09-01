export const USER_BLOCK_READER = Symbol('USER_BLOCK_READER');

/**
 * Read port other bounded contexts use to hide blocked users and refuse
 * interaction. Implemented in moderation infrastructure.
 */
export interface IUserBlockReader {
  /** True if either user has blocked the other. */
  isBlockedBetween(userId: string, otherUserId: string): Promise<boolean>;
  /**
   * User ids the viewer must not see or interact with: people they blocked
   * and people who blocked them.
   */
  listHiddenUserIds(viewerId: string): Promise<string[]>;
}
