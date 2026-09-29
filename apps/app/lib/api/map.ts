import { apiRequest } from '@/lib/api/client';
import type { MapPlacesResponseApi, MapUserPinApi } from '@/lib/api/types';
import type { MapPlaceFilter } from '@/constants/map-place-filters';
import { radiusKmForPlacesRequest } from '@/constants/map-place-filters';

export function updateMyMapLocation(latitude: number, longitude: number) {
  return apiRequest<{ ok: boolean }>('/map/me/location', {
    method: 'PUT',
    body: { latitude, longitude },
  });
}

export async function searchLocalities(query: string): Promise<string[]> {
  const result = await apiRequest<{ suggestions: string[] }>(
    `/map/localities?q=${encodeURIComponent(query)}`,
  );
  return result.suggestions ?? [];
}

export function listMapUsers() {
  return apiRequest<MapUserPinApi[]>('/map/users');
}

export function listDogFriendlyPlaces(input: {
  latitude: number;
  longitude: number;
  radiusKm?: string;
  category: MapPlaceFilter;
}) {
  const query = new URLSearchParams();
  query.set('latitude', String(input.latitude));
  query.set('longitude', String(input.longitude));
  query.set('category', input.category);
  const radiusKm = radiusKmForPlacesRequest(input.radiusKm ?? '');
  if (radiusKm != null) query.set('radiusKm', String(radiusKm));
  return apiRequest<MapPlacesResponseApi>(`/map/places?${query.toString()}`);
}
