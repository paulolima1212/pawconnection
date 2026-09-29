import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ILocalitySearch,
  LocalityPrediction,
} from '../domain/ports/locality-search.port';

const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const FIELD_MASK = [
  'suggestions.placePrediction.text',
  'suggestions.placePrediction.structuredFormat',
].join(',');

const LOCALITY_TYPES = ['locality', 'sublocality', 'neighborhood'];

type GooglePlacePrediction = {
  text?: { text?: string };
  structuredFormat?: {
    mainText?: { text?: string };
    secondaryText?: { text?: string };
  };
};

type GoogleAutocompleteResponse = {
  suggestions?: Array<{ placePrediction?: GooglePlacePrediction }>;
  error?: { message?: string };
};

@Injectable()
export class GoogleLocalitySearch implements ILocalitySearch {
  private readonly logger = new Logger(GoogleLocalitySearch.name);

  constructor(private readonly config: ConfigService) {}

  async search(query: string): Promise<LocalityPrediction[]> {
    const apiKey =
      this.config.get<string>('GOOGLE_PLACES_API_KEY')?.trim() ||
      this.config.get<string>('GOOGLE_MAPS_API_KEY')?.trim();
    if (!apiKey) {
      this.logger.warn(
        'GOOGLE_PLACES_API_KEY is not set; locality suggestions will be empty',
      );
      return [];
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetch(AUTOCOMPLETE_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': FIELD_MASK,
        },
        body: JSON.stringify({
          input: query,
          includedPrimaryTypes: LOCALITY_TYPES,
          includeQueryPredictions: false,
        }),
      });
      const payload = (await response.json()) as GoogleAutocompleteResponse;
      if (!response.ok) {
        this.logger.warn(
          `Places Autocomplete failed status=${response.status} message=${payload.error?.message ?? 'unknown'}`,
        );
        return [];
      }
      return (payload.suggestions ?? [])
        .map((suggestion) => this.toPrediction(suggestion.placePrediction))
        .filter((item): item is LocalityPrediction => item != null);
    } catch (err) {
      this.logger.warn(
        `Places Autocomplete request failed: ${err instanceof Error ? err.message : 'unknown'}`,
      );
      return [];
    } finally {
      clearTimeout(timer);
    }
  }

  private toPrediction(
    prediction: GooglePlacePrediction | undefined,
  ): LocalityPrediction | null {
    const main =
      prediction?.structuredFormat?.mainText?.text?.trim() ||
      prediction?.text?.text?.trim() ||
      '';
    if (!main) return null;
    const secondary = prediction?.structuredFormat?.secondaryText?.text?.trim();
    return { mainText: main, secondaryText: secondary || null };
  }
}
