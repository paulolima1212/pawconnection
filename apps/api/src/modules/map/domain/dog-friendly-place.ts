import { AppInterest } from '../../../shared/domain/types';

export const PLACE_CATEGORIES = ['parks', 'services', 'cafes'] as const;
export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

export const PLACE_FILTERS = ['forYou', 'parks', 'services', 'cafes', 'all'] as const;
export type PlaceFilter = (typeof PLACE_FILTERS)[number];

export const DEFAULT_PLACES_RADIUS_KM = 5;
export const MIN_PLACES_RADIUS_KM = 1;
export const MAX_PLACES_RADIUS_KM = 50;

const INHERENT_DOG_TYPES = new Set(['dog_park', 'veterinary_care', 'pet_store']);
const PARK_TYPES = new Set(['dog_park', 'park']);
const SERVICE_TYPES = new Set(['veterinary_care', 'pet_store']);
const CAFE_TYPES = new Set(['cafe', 'restaurant']);
const WATER_HINT = /beach|lake|river|harbour|harbor|bay|water|coast/i;

export type ViewerPlaceProfile = {
  interests: readonly string[];
  enjoysPark: boolean;
  enjoysWater: boolean;
  enjoysWalks: boolean;
};

export type PlaceCandidate = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  types: readonly string[];
  primaryType: string | null;
  allowsDogs: boolean | null;
  address: string | null;
};

export type RankedPlace = PlaceCandidate & {
  category: PlaceCategory;
  distanceKm: number;
  featured: boolean;
};

const TYPES_BY_CATEGORY: Record<PlaceCategory, readonly string[]> = {
  parks: ['dog_park', 'park'],
  services: ['veterinary_care', 'pet_store'],
  cafes: ['cafe', 'restaurant'],
};

export function resolvePlacesRadiusKm(radiusKm?: number): number {
  if (radiusKm == null || !Number.isFinite(radiusKm) || radiusKm < 1) {
    return DEFAULT_PLACES_RADIUS_KM;
  }
  return Math.min(MAX_PLACES_RADIUS_KM, Math.max(MIN_PLACES_RADIUS_KM, Math.round(radiusKm)));
}

export function parsePlaceFilter(raw?: string): PlaceFilter {
  if (raw && (PLACE_FILTERS as readonly string[]).includes(raw)) {
    return raw as PlaceFilter;
  }
  return 'forYou';
}

function hasInterest(profile: ViewerPlaceProfile, interest: AppInterest): boolean {
  return profile.interests.includes(interest);
}

function wantsAll(profile: ViewerPlaceProfile): boolean {
  return hasInterest(profile, AppInterest.AllTheAbove);
}

export function featuredPlaceCategory(profile: ViewerPlaceProfile): PlaceCategory {
  const outdoor =
    profile.enjoysPark || profile.enjoysWalks || profile.enjoysWater;
  if (hasInterest(profile, AppInterest.DogPlaydates) && !wantsAll(profile)) {
    return 'parks';
  }
  if (hasInterest(profile, AppInterest.DogFriendlyLocations) && !wantsAll(profile)) {
    return 'parks';
  }
  if (hasInterest(profile, AppInterest.DogServices) && !wantsAll(profile) && !outdoor) {
    return 'services';
  }
  if (outdoor) return 'parks';
  if (hasInterest(profile, AppInterest.DogServices)) return 'services';
  return 'parks';
}

export function includedTypesForFilter(
  filter: PlaceFilter,
  profile: ViewerPlaceProfile,
): readonly string[] {
  if (filter === 'parks' || filter === 'services' || filter === 'cafes') {
    return TYPES_BY_CATEGORY[filter];
  }
  if (filter === 'all') {
    return [...TYPES_BY_CATEGORY.parks, ...TYPES_BY_CATEGORY.services, ...TYPES_BY_CATEGORY.cafes];
  }

  const types = new Set<string>(['dog_park']);
  const all = wantsAll(profile);
  if (
    all ||
    hasInterest(profile, AppInterest.DogPlaydates) ||
    hasInterest(profile, AppInterest.DogFriendlyLocations) ||
    hasInterest(profile, AppInterest.Friendship) ||
    profile.enjoysPark ||
    profile.enjoysWalks ||
    profile.enjoysWater ||
    profile.interests.length === 0
  ) {
    types.add('park');
  }
  if (all || hasInterest(profile, AppInterest.DogServices)) {
    types.add('veterinary_care');
    types.add('pet_store');
  }
  if (
    all ||
    hasInterest(profile, AppInterest.DogFriendlyLocations) ||
    hasInterest(profile, AppInterest.Friendship) ||
    profile.interests.length === 0
  ) {
    types.add('cafe');
  }
  return [...types];
}

export function categoryOfPlace(place: Pick<PlaceCandidate, 'types' | 'primaryType'>): PlaceCategory | null {
  const tokens = [place.primaryType, ...place.types].filter((t): t is string => Boolean(t));
  if (tokens.some((t) => PARK_TYPES.has(t))) return 'parks';
  if (tokens.some((t) => SERVICE_TYPES.has(t))) return 'services';
  if (tokens.some((t) => CAFE_TYPES.has(t))) return 'cafes';
  return null;
}

export function isDogFriendlyPlace(place: PlaceCandidate): boolean {
  const tokens = [place.primaryType, ...place.types].filter((t): t is string => Boolean(t));
  if (tokens.some((t) => INHERENT_DOG_TYPES.has(t))) return true;
  if (place.allowsDogs === true) return true;
  const isPark = tokens.some((t) => t === 'park');
  if (isPark && place.allowsDogs !== false) return true;
  return false;
}

export function rankDogFriendlyPlaces(
  places: Array<PlaceCandidate & { distanceKm: number }>,
  profile: ViewerPlaceProfile,
  featured: PlaceCategory,
): RankedPlace[] {
  const waterBoost = profile.enjoysWater;
  return places
    .map((place) => {
      const category = categoryOfPlace(place) ?? featured;
      return {
        ...place,
        category,
        featured: category === featured,
      };
    })
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      const aWater = waterBoost && WATER_HINT.test(`${a.name} ${a.types.join(' ')}`);
      const bWater = waterBoost && WATER_HINT.test(`${b.name} ${b.types.join(' ')}`);
      if (aWater !== bWater) return aWater ? -1 : 1;
      return a.distanceKm - b.distanceKm;
    });
}

export function matchesIncludedTypes(
  place: PlaceCandidate,
  includedTypes: readonly string[],
): boolean {
  if (includedTypes.length === 0) return true;
  const allowed = new Set(includedTypes);
  const tokens = [place.primaryType, ...place.types].filter((t): t is string => Boolean(t));
  return tokens.some((t) => allowed.has(t));
}

export function viewerPlaceProfileFromUser(user: {
  interests?: readonly string[] | null;
  pet?: {
    enjoysPark?: boolean | null;
    enjoysWater?: boolean | null;
    enjoysWalks?: boolean | null;
  } | null;
}): ViewerPlaceProfile {
  return {
    interests: user.interests ?? [],
    enjoysPark: Boolean(user.pet?.enjoysPark),
    enjoysWater: Boolean(user.pet?.enjoysWater),
    enjoysWalks: Boolean(user.pet?.enjoysWalks),
  };
}
