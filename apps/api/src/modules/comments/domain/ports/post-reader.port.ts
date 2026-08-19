export const POST_READER = Symbol('POST_READER');

/**
 * Minimal read port the comments module needs from the posts context. Declared
 * here (in the comments domain) and implemented in infrastructure, so comments
 * stay decoupled from the feed module's internals.
 */
export interface IPostReader {
  exists(postId: string): Promise<boolean>;
  /** Author of the post, used e.g. to notify on new comments. Null if missing. */
  getAuthorId(postId: string): Promise<string | null>;
}
