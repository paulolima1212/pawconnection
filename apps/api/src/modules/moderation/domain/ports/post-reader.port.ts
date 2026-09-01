export const MODERATION_POST_READER = Symbol('MODERATION_POST_READER');

export interface IModerationPostReader {
  getAuthorId(postId: string): Promise<string | null>;
}
