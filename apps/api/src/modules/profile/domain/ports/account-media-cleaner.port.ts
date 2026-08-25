export const ACCOUNT_MEDIA_CLEANER = Symbol('ACCOUNT_MEDIA_CLEANER');

/** Removes stored profile media after the account row is gone. */
export interface IAccountMediaCleaner {
  removeObjectUrls(urls: string[]): Promise<void>;
}
