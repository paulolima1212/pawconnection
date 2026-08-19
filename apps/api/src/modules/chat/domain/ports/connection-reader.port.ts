export const CHAT_CONNECTION_READER = Symbol('CHAT_CONNECTION_READER');

export interface IChatConnectionReader {
  /** True when users have an accepted connection request in either direction. */
  isFriend(userId: string, otherUserId: string): Promise<boolean>;
  /** Batch friend lookup for conversation lists. */
  friendStatusForOthers(userId: string, otherUserIds: string[]): Promise<Map<string, boolean>>;
}
