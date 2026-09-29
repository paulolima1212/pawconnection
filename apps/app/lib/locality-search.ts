const MIN_LOCALITY_QUERY = 2;
const MAX_LOCALITY_QUERY = 80;

/** Query sent to locality autocomplete. Null until the user has typed a city or neighborhood. */
export function localitySearchQuery(text: string): string | null {
  const query = text.trim().replace(/\s+/g, ' ');
  if (query.length < MIN_LOCALITY_QUERY) return null;
  return query.slice(0, MAX_LOCALITY_QUERY);
}
