import { Injectable, Logger } from '@nestjs/common';
import {
  ILocalitySearch,
  LocalityPrediction,
} from '../domain/ports/locality-search.port';
import {
  localityFromAddress,
  regionAbbreviation,
} from '../domain/nominatim-locality';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const ALLOWED_TYPES = new Set([
  'city',
  'town',
  'village',
  'municipality',
  'suburb',
  'neighbourhood',
  'quarter',
  'city_district',
  'borough',
  'hamlet',
  'administrative',
]);

type NominatimHit = {
  type?: string;
  address?: {
    neighbourhood?: string;
    suburb?: string;
    city_district?: string;
    city?: string;
    town?: string;
    municipality?: string;
    village?: string;
    state?: string;
    country?: string;
    'ISO3166-2-lvl4'?: string;
  };
};

@Injectable()
export class NominatimLocalitySearch implements ILocalitySearch {
  private readonly logger = new Logger(NominatimLocalitySearch.name);
  private lastRequestAt = 0;

  async search(query: string): Promise<LocalityPrediction[]> {
    await this.respectRateLimit();
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '6');
    url.searchParams.set('accept-language', 'pt-BR,en');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'PawConnection/1.0 (profile location autocomplete)',
        },
      });
      if (!response.ok) {
        this.logger.warn(`Nominatim failed status=${response.status}`);
        return [];
      }
      const payload = (await response.json()) as NominatimHit[];
      const suggestions: LocalityPrediction[] = [];
      for (const hit of payload) {
        if (hit.type && !ALLOWED_TYPES.has(hit.type)) continue;
        const stateCode = regionAbbreviation(hit.address?.['ISO3166-2-lvl4']);
        const prediction = localityFromAddress({
          ...hit.address,
          stateCode,
        });
        if (prediction) suggestions.push(prediction);
      }
      return suggestions;
    } catch (err) {
      this.logger.warn(
        `Nominatim request failed: ${err instanceof Error ? err.message : 'unknown'}`,
      );
      return [];
    } finally {
      clearTimeout(timer);
    }
  }

  private async respectRateLimit(): Promise<void> {
    const wait = 1100 - (Date.now() - this.lastRequestAt);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    this.lastRequestAt = Date.now();
  }
}
