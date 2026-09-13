export const MAP_PLACE_FILTER_OPTIONS = [
  { value: 'forYou' as const, label: 'For you' },
  { value: 'parks' as const, label: 'Parks' },
  { value: 'services' as const, label: 'Services' },
  { value: 'cafes' as const, label: 'Cafés' },
  { value: 'all' as const, label: 'All dog-friendly' },
] as const;

export type MapPlaceFilter = (typeof MAP_PLACE_FILTER_OPTIONS)[number]['value'];

export type MapPlaceCategory = 'parks' | 'services' | 'cafes';

/** Worldwide (empty chip) uses the API default of 5 km for nearby places. */
export function radiusKmForPlacesRequest(radiusKm: string): number | undefined {
  const n = Number(radiusKm);
  if (!radiusKm || !Number.isFinite(n) || n < 1) return undefined;
  return n;
}
