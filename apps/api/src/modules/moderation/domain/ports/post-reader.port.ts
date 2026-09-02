export const MODERATION_POST_READER = Symbol('MODERATION_POST_READER');

export type ReportedPostSnapshot = {
  id: string;
  body: string | null;
  imageUrls: string[];
  authorId: string;
  authorHandle: string;
  authorName: string;
};

export interface IModerationPostReader {
  getAuthorId(postId: string): Promise<string | null>;
  getSnapshot(postId: string): Promise<ReportedPostSnapshot | null>;
}
