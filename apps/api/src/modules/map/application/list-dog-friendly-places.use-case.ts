import { Inject, Injectable, Logger } from '@nestjs/common';
import { ValidationError } from '../../../shared/domain/result';
import { haversineKm } from '../../../shared/infrastructure/mappers/prisma.mapper';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../profile/domain/repositories/user.repository';
import {
  featuredPlaceCategory,
  includedTypesForFilter,
  isDogFriendlyPlace,
  matchesIncludedTypes,
  parsePlaceFilter,
  rankDogFriendlyPlaces,
  resolvePlacesRadiusKm,
  viewerPlaceProfileFromUser,
  type PlaceFilter,
  type RankedPlace,
} from '../domain/dog-friendly-place';
import {
  IPlacesSearch,
  PLACES_SEARCH,
} from '../domain/ports/places-search.port';

function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export type ListDogFriendlyPlacesInput = {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  category?: string;
};

export type DogFriendlyPlacesResponse = {
  category: PlaceFilter;
  featuredCategory: RankedPlace['category'];
  radiusKm: number;
  items: Array<{
    id: string;
    name: string;
    category: RankedPlace['category'];
    featured: boolean;
    latitude: number;
    longitude: number;
    distanceKm: number;
    address: string | null;
    types: string[];
    allowsDogs: boolean | null;
  }>;
};

@Injectable()
export class ListDogFriendlyPlacesUseCase {
  private readonly logger = new Logger(ListDogFriendlyPlacesUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(PLACES_SEARCH) private readonly places: IPlacesSearch,
  ) {}

  async execute(
    viewerId: string,
    input: ListDogFriendlyPlacesInput,
  ): Promise<DogFriendlyPlacesResponse> {
    if (!isValidCoordinate(input.latitude, input.longitude)) {
      throw new ValidationError('Invalid coordinates');
    }

    const viewer = await this.users.findById(viewerId);
    const profile = viewerPlaceProfileFromUser(viewer ?? {});
    const filter = parsePlaceFilter(input.category);
    const radiusKm = resolvePlacesRadiusKm(input.radiusKm);
    const featured = featuredPlaceCategory(profile);
    const includedTypes = includedTypesForFilter(filter, profile);

    let hits: Awaited<ReturnType<IPlacesSearch['searchNearby']>> = [];
    try {
      hits = await this.places.searchNearby({
        latitude: input.latitude,
        longitude: input.longitude,
        radiusMeters: radiusKm * 1000,
        includedTypes,
      });
    } catch (err) {
      this.logger.warn(
        `Dog-friendly places search failed: ${err instanceof Error ? err.message : 'unknown'}`,
      );
    }

    const seen = new Set<string>();
    const candidates = hits.filter((hit) => {
      if (seen.has(hit.id)) return false;
      seen.add(hit.id);
      return matchesIncludedTypes(hit, includedTypes) && isDogFriendlyPlace(hit);
    });

    const ranked = rankDogFriendlyPlaces(
      candidates.map((hit) => ({
        ...hit,
        distanceKm: haversineKm(
          input.latitude,
          input.longitude,
          hit.latitude,
          hit.longitude,
        ),
      })),
      profile,
      featured,
    );

    this.logger.log(
      `Listed ${ranked.length} dog-friendly places filter=${filter} featured=${featured} radiusKm=${radiusKm}`,
    );

    return {
      category: filter,
      featuredCategory: featured,
      radiusKm,
      items: ranked.map((place) => ({
        id: place.id,
        name: place.name,
        category: place.category,
        featured: place.featured,
        latitude: place.latitude,
        longitude: place.longitude,
        distanceKm: Math.round(place.distanceKm * 10) / 10,
        address: place.address,
        types: [...place.types],
        allowsDogs: place.allowsDogs,
      })),
    };
  }
}
