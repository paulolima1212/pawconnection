import type { ProfileDraft } from '@/context/profile-onboarding';
import { resolveMediaDisplayUrl } from '@/lib/api/media';
import type { FeedPostApi, ProfileMeResponse } from '@/lib/api/types';

export function withAuthorPhotos(
  post: FeedPostApi,
  sources: {
    ownerPhotoUrl?: string | null;
    petPhotoUrl?: string | null;
  },
): FeedPostApi {
  if (!post.author) return post;
  return {
    ...post,
    author: {
      ...post.author,
      photoUrl: sources.ownerPhotoUrl ?? post.author.photoUrl ?? null,
      petPhotoUrl: sources.petPhotoUrl ?? post.author.petPhotoUrl ?? null,
    },
  };
}

export function authorPhotosFromProfile(profile: ProfileMeResponse) {
  return {
    ownerPhotoUrl: resolveMediaDisplayUrl(profile.owner.photoUrl ?? null),
    petPhotoUrl: resolveMediaDisplayUrl(profile.pet?.photoUrl ?? null),
  };
}

export function authorPhotosFromDraft(draft: ProfileDraft) {
  return {
    ownerPhotoUrl: resolveMediaDisplayUrl(draft.humanPhotoUri),
    petPhotoUrl: resolveMediaDisplayUrl(draft.dogPhotoUri),
  };
}

export function mergeAuthorPhotoSources(
  post: FeedPostApi,
  profile: ProfileMeResponse | null | undefined,
  draft: ProfileDraft,
): FeedPostApi {
  const fromProfile = profile ? authorPhotosFromProfile(profile) : null;
  const fromDraft = authorPhotosFromDraft(draft);
  return withAuthorPhotos(post, {
    ownerPhotoUrl: fromProfile?.ownerPhotoUrl ?? fromDraft.ownerPhotoUrl,
    petPhotoUrl: fromProfile?.petPhotoUrl ?? fromDraft.petPhotoUrl,
  });
}
