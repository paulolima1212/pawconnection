export const CHAT_USER_READER = Symbol('CHAT_USER_READER');

export type ChatUserSnapshot = {
  id: string;
  fullName: string;
  handle: string;
  photoUrl: string | null;
  onboardingComplete: boolean;
};

export interface IChatUserReader {
  findById(userId: string): Promise<ChatUserSnapshot | null>;
  findByHandle(handle: string): Promise<ChatUserSnapshot | null>;
}
