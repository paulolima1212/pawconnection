import type { FeedPostScope, FeedRadiusKm } from '@/constants/feed-discovery-filters';
import type { ListFeedPostsParams } from '@/lib/api/feed';
import type { GenderValue } from '@/context/profile-onboarding';

export type FeedSearchFilters = {
  city?: string;
  author?: string;
  petGender?: GenderValue | '';
  petAge?: string;
  petSize?: '' | 'small' | 'medium' | 'large';
};

export const EMPTY_FEED_SEARCH_FILTERS: FeedSearchFilters = {
  city: '',
  author: '',
  petGender: '',
  petAge: '',
  petSize: '',
};

export const FEED_PET_GENDER_FILTER_OPTIONS = [
  { value: '' as const, label: 'Any gender' },
  { value: 'Male' as const, label: 'Male' },
  { value: 'Female' as const, label: 'Female' },
];

export const FEED_PET_SIZE_FILTER_OPTIONS = [
  { value: '' as const, label: 'Any size' },
  { value: 'small' as const, label: 'Small' },
  { value: 'medium' as const, label: 'Medium' },
  { value: 'large' as const, label: 'Large' },
];

export function countActiveFeedSearchFilters(filters: FeedSearchFilters): number {
  let n = 0;
  if (filters.city?.trim()) n += 1;
  if (filters.author?.trim()) n += 1;
  if (filters.petGender) n += 1;
  if (filters.petAge?.trim()) n += 1;
  if (filters.petSize) n += 1;
  return n;
}

export function hasActiveFeedDiscoveryFilters(
  selectedCity: string,
  radiusKm: string,
  postScope: string,
): boolean {
  return Boolean(selectedCity.trim()) || Boolean(radiusKm) || postScope !== 'all';
}

export function buildListFeedPostsParams(args: {
  searchText: string;
  searchFilters: FeedSearchFilters;
  selectedCity: string;
  radiusKm: FeedRadiusKm;
  postScope: FeedPostScope;
}): ListFeedPostsParams {
  const params: ListFeedPostsParams = {};

  if (args.postScope !== 'all') params.scope = args.postScope;

  const radius = Number(args.radiusKm);
  if (args.radiusKm && radius > 0) params.radiusKm = radius;

  const cityFromChip = args.selectedCity.trim();
  const cityFromFilters = args.searchFilters.city?.trim();
  const city = cityFromFilters || cityFromChip;
  if (city) params.city = city;

  const author = args.searchFilters.author?.trim();
  if (author) params.author = author;

  if (args.searchFilters.petGender) {
    params.petGender = args.searchFilters.petGender;
  }

  const petAgeRaw = args.searchFilters.petAge?.trim();
  if (petAgeRaw) {
    const petAge = Number.parseInt(petAgeRaw, 10);
    if (!Number.isNaN(petAge)) params.petAge = petAge;
  }

  if (args.searchFilters.petSize) {
    params.petSize = args.searchFilters.petSize;
  }

  const q = args.searchText.trim();
  if (q) params.q = q;

  return params;
}
