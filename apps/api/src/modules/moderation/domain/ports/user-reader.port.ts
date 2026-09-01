export const MODERATION_USER_READER = Symbol('MODERATION_USER_READER');

export type ModerationUserSummary = {
  id: string;
  fullName: string;
  handle: string;
  photoUrl: string | null;
};

export interface IModerationUserReader {
  exists(userId: string): Promise<boolean>;
  findSummariesByIds(ids: string[]): Promise<ModerationUserSummary[]>;
}
