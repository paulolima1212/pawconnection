import { Inject, Injectable } from '@nestjs/common';
import { formatLocalityLabel } from '../domain/locality-label';
import {
  ILocalitySearch,
  LOCALITY_SEARCH,
} from '../domain/ports/locality-search.port';

const MIN_QUERY = 2;
const MAX_RESULTS = 6;

@Injectable()
export class SearchLocalitiesUseCase {
  constructor(
    @Inject(LOCALITY_SEARCH) private readonly localities: ILocalitySearch,
  ) {}

  async execute(rawQuery: string): Promise<{ suggestions: string[] }> {
    const query = rawQuery.trim().replace(/\s+/g, ' ').slice(0, 80);
    if (query.length < MIN_QUERY) return { suggestions: [] };

    let predictions: Awaited<ReturnType<ILocalitySearch['search']>>;
    try {
      predictions = await this.localities.search(query);
    } catch {
      return { suggestions: [] };
    }

    const suggestions: string[] = [];
    for (const prediction of predictions) {
      const label = formatLocalityLabel(
        prediction.mainText,
        prediction.secondaryText,
      );
      if (!label || suggestions.includes(label)) continue;
      suggestions.push(label);
      if (suggestions.length >= MAX_RESULTS) break;
    }
    return { suggestions };
  }
}
