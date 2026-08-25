import { UserEntity } from '../../../shared/domain/types';

/** Collects public media URLs owned by a profile so storage can be cleaned up. */
export function collectProfileMediaUrls(user: UserEntity): string[] {
  const urls = [
    user.photoUrl,
    ...(user.photoUrls ?? []),
    user.pet?.photoUrl,
    ...(user.pet?.photoUrls ?? []),
  ].filter((url): url is string => Boolean(url?.trim()));
  return [...new Set(urls)];
}
