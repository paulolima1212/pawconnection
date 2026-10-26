import { ForbiddenError, ValidationError } from '../../../shared/domain/result';
import { PostVisibilityValue } from '../../../shared/domain/types';

const MAX_BODY_LENGTH = 2000;
const MAX_PHOTOS = 8;

export type FeedPostSnapshot = {
  id: string;
  authorId: string;
  body: string | null;
  imageUrls: string[];
  visibility: PostVisibilityValue;
};

export type FeedPostEdit = {
  body?: string | null;
  imageUrls: string[];
  visibility?: PostVisibilityValue;
};

/** A published post. Only its author may change or remove it. */
export class FeedPost {
  private constructor(private readonly snapshot: FeedPostSnapshot) {}

  static restore(snapshot: FeedPostSnapshot): FeedPost {
    return new FeedPost(snapshot);
  }

  edit(actorId: string, change: FeedPostEdit): FeedPostSnapshot {
    if (actorId !== this.snapshot.authorId) {
      throw new ForbiddenError('Only the author can edit this post');
    }

    const body = normalizeBody(change.body);
    const imageUrls = normalizeImages(change.imageUrls);
    if (!body && imageUrls.length === 0) {
      throw new ValidationError('A post needs text or a photo');
    }

    return {
      id: this.snapshot.id,
      authorId: this.snapshot.authorId,
      body,
      imageUrls,
      visibility: change.visibility ?? this.snapshot.visibility,
    };
  }

  assertDeletableBy(actorId: string): void {
    if (actorId !== this.snapshot.authorId) {
      throw new ForbiddenError('Only the author can delete this post');
    }
  }
}

function normalizeBody(body: string | null | undefined): string | null {
  const trimmed = body?.trim() ?? '';
  if (!trimmed) return null;
  if (trimmed.length > MAX_BODY_LENGTH) {
    throw new ValidationError('Post text is too long');
  }
  return trimmed;
}

function normalizeImages(imageUrls: string[]): string[] {
  const urls = imageUrls.map((url) => url.trim()).filter(Boolean);
  if (urls.length > MAX_PHOTOS) {
    throw new ValidationError('A post can have at most 8 photos');
  }
  return urls;
}
