export const MODERATION_POLICY = Symbol('MODERATION_POLICY');

/**
 * Authorization port for moderation actions. Today the default implementation
 * has no privileged roles (the User model has none), but every deletion already
 * routes through this policy, so adding roles / shadow-ban later is a single
 * implementation change with no use-case rewrites.
 */
export interface IModerationPolicy {
  isModerator(userId: string): Promise<boolean>;
}
