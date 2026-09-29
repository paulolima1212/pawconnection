import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ILocalitySearch,
  LocalityPrediction,
} from '../domain/ports/locality-search.port';
import { GoogleLocalitySearch } from './google-locality.search';
import { NominatimLocalitySearch } from './nominatim-locality.search';

@Injectable()
export class LocalitySearch implements ILocalitySearch {
  constructor(
    private readonly config: ConfigService,
    private readonly google: GoogleLocalitySearch,
    private readonly nominatim: NominatimLocalitySearch,
  ) {}

  async search(query: string): Promise<LocalityPrediction[]> {
    if (this.hasPlacesKey()) {
      const google = await this.google.search(query);
      if (google.length > 0) return google;
    }
    return this.nominatim.search(query);
  }

  private hasPlacesKey(): boolean {
    return Boolean(
      this.config.get<string>('GOOGLE_PLACES_API_KEY')?.trim() ||
        this.config.get<string>('GOOGLE_MAPS_API_KEY')?.trim(),
    );
  }
}
