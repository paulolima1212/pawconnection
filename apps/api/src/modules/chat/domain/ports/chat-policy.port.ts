export const CHAT_POLICY = Symbol('CHAT_POLICY');

export interface IChatPolicy {
  /** Returns false when messaging must be blocked (future: blocks, bans). */
  canUsersCommunicate(senderId: string, recipientId: string): Promise<void>;
}
