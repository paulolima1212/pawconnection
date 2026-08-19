import { CompositeSpecification } from '../../../../shared/domain/specification';
import { PostEntity, UserSummary } from '../../../../shared/domain/types';

export type FeedScope = 'all' | 'friends' | 'mine';
export type PetSizeFilter = 'small' | 'medium' | 'large';

export type FeedPostFilters = {
  city?: string;
  author?: string;
  petGender?: string;
  petAge?: number;
  petSize?: PetSizeFilter;
  q?: string;
};

export type FeedPostWithAuthorMeta = PostEntity & {
  authorLat?: number | null;
  authorLng?: number | null;
  author?: UserSummary;
};

export class PublishedPostsSpec extends CompositeSpecification<PostEntity> {
  isSatisfiedBy(_post: PostEntity): boolean {
    return true;
  }
}

export class PostScopeSpec extends CompositeSpecification<PostEntity> {
  constructor(
    private readonly scope: FeedScope,
    private readonly userId: string,
  ) {
    super();
  }

  isSatisfiedBy(post: PostEntity): boolean {
    if (this.scope === 'all') return true;
    if (this.scope === 'mine') return post.authorId === this.userId;
    return true;
  }
}

export class PostSearchSpec extends CompositeSpecification<PostEntity> {
  constructor(private readonly query: string) {
    super();
  }

  isSatisfiedBy(post: PostEntity): boolean {
    if (!this.query.trim()) return true;
    const q = this.query.toLowerCase();
    return (post.body ?? '').toLowerCase().includes(q);
  }
}

/** True when the author's profile location matches the selected area label (from geocoding). */
export function postAuthorMatchesCity(
  authorLocation: string | null | undefined,
  city: string,
): boolean {
  const needle = city.trim().toLowerCase();
  if (!needle) return true;
  const haystack = authorLocation?.trim().toLowerCase();
  if (!haystack) return false;
  return haystack.includes(needle) || needle.includes(haystack);
}

export function postMatchesAuthorFilter(
  post: FeedPostWithAuthorMeta,
  author?: string,
): boolean {
  const needle = author?.trim().toLowerCase();
  if (!needle) return true;
  const fields = [
    post.author?.fullName,
    post.author?.handle,
    post.author?.petName,
  ];
  return fields.some((f) => f?.toLowerCase().includes(needle));
}

export function postMatchesPetGenderFilter(
  post: FeedPostWithAuthorMeta,
  petGender?: string,
): boolean {
  const expected = petGender?.trim();
  if (!expected) return true;
  return post.author?.petGender === expected;
}

export function postMatchesPetAgeFilter(
  post: FeedPostWithAuthorMeta,
  petAge?: number,
): boolean {
  if (petAge == null || Number.isNaN(petAge)) return true;
  return post.author?.petAge === petAge;
}

const PET_SIZE_BREED_KEYWORDS: Record<PetSizeFilter, string[]> = {
  small: [
    'chihuahua',
    'pomeranian',
    'yorkshire',
    'maltese',
    'shih tzu',
    'pug',
    'pequeno',
    'mini',
    'toy',
  ],
  medium: [
    'beagle',
    'cocker',
    'bulldog',
    'border',
    'australian',
    'médio',
    'medio',
    'medium',
  ],
  large: [
    'retriever',
    'shepherd',
    'husky',
    'mastiff',
    'great dane',
    'bernese',
    'saint bernard',
    'grande',
    'large',
  ],
};

export function postMatchesPetSizeFilter(
  post: FeedPostWithAuthorMeta,
  petSize?: PetSizeFilter,
): boolean {
  if (!petSize) return true;
  const breed = post.author?.petBreed?.trim().toLowerCase();
  if (!breed) return false;
  return PET_SIZE_BREED_KEYWORDS[petSize].some((keyword) => breed.includes(keyword));
}

export function postMatchesFeedFilters(
  post: FeedPostWithAuthorMeta,
  filters: FeedPostFilters,
): boolean {
  if (filters.q?.trim()) {
    const q = filters.q.trim().toLowerCase();
    if (!(post.body ?? '').toLowerCase().includes(q)) return false;
  }
  if (filters.city?.trim() && !postAuthorMatchesCity(post.author?.location, filters.city)) {
    return false;
  }
  if (!postMatchesAuthorFilter(post, filters.author)) return false;
  if (!postMatchesPetGenderFilter(post, filters.petGender)) return false;
  if (!postMatchesPetAgeFilter(post, filters.petAge)) return false;
  if (!postMatchesPetSizeFilter(post, filters.petSize)) return false;
  return true;
}

export class PostWithinRadiusSpec extends CompositeSpecification<PostEntity & { authorLat?: number | null; authorLng?: number | null }> {
  constructor(
    private readonly lat: number,
    private readonly lng: number,
    private readonly radiusKm: number,
  ) {
    super();
  }

  isSatisfiedBy(
    post: PostEntity & { authorLat?: number | null; authorLng?: number | null },
  ): boolean {
    if (post.authorLat == null || post.authorLng == null || this.radiusKm <= 0) {
      return true;
    }
    const R = 6371;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(post.authorLat - this.lat);
    const dLng = toRad(post.authorLng - this.lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(this.lat)) *
        Math.cos(toRad(post.authorLat)) *
        Math.sin(dLng / 2) ** 2;
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return distance <= this.radiusKm;
  }
}
