import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPlacesSearch,
  NearbyPlaceHit,
  NearbyPlacesQuery,
} from '../domain/ports/places-search.port';

const PLACES_NEARBY_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.location',
  'places.types',
  'places.primaryType',
  'places.allowsDogs',
  'places.formattedAddress',
  'places.shortFormattedAddress',
].join(',');

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  location?: { latitude?: number; longitude?: number };
  types?: string[];
  primaryType?: string;
  allowsDogs?: boolean;
  formattedAddress?: string;
  shortFormattedAddress?: string;
};

type GoogleNearbyResponse = {
  places?: GooglePlace[];
  error?: { message?: string; status?: string };
};

@Injectable()
export class GooglePlacesSearch implements IPlacesSearch {
  private readonly logger = new Logger(GooglePlacesSearch.name);

  constructor(private readonly config: ConfigService) {}

  async searchNearby(query: NearbyPlacesQuery): Promise<NearbyPlaceHit[]> {
    const apiKey =
      this.config.get<string>('GOOGLE_PLACES_API_KEY')?.trim() ||
      this.config.get<string>('GOOGLE_MAPS_API_KEY')?.trim();
    if (!apiKey) {
      this.logger.warn('GOOGLE_PLACES_API_KEY is not set; dog-friendly places will be empty');
      return [];
    }
    if (query.includedTypes.length === 0) return [];

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetch(PLACES_NEARBY_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': FIELD_MASK,
        },
        body: JSON.stringify({
          includedTypes: [...query.includedTypes],
          maxResultCount: 20,
          locationRestriction: {
            circle: {
              center: { latitude: query.latitude, longitude: query.longitude },
              radius: query.radiusMeters,
            },
          },
        }),
      });
      const payload = (await response.json()) as GoogleNearbyResponse;
      if (!response.ok) {
        this.logger.warn(
          `Places Nearby failed status=${response.status} message=${payload.error?.message ?? 'unknown'}`,
        );
        return [];
      }
      return (payload.places ?? [])
        .map((place) => this.toHit(place))
        .filter((hit): hit is NearbyPlaceHit => hit != null);
    } catch (err) {
      this.logger.warn(
        `Places Nearby request failed: ${err instanceof Error ? err.message : 'unknown'}`,
      );
      return [];
    } finally {
      clearTimeout(timer);
    }
  }

  private toHit(place: GooglePlace): NearbyPlaceHit | null {
    const latitude = place.location?.latitude;
    const longitude = place.location?.longitude;
    const name = place.displayName?.text?.trim();
    if (!place.id || !name || latitude == null || longitude == null) return null;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return {
      id: place.id,
      name,
      latitude,
      longitude,
      types: place.types ?? [],
      primaryType: place.primaryType ?? null,
      allowsDogs: typeof place.allowsDogs === 'boolean' ? place.allowsDogs : null,
      address: place.shortFormattedAddress ?? place.formattedAddress ?? null,
    };
  }
}
