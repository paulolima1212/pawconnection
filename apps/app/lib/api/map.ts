import { apiRequest } from '@/lib/api/client';
import type { MapUserPinApi } from '@/lib/api/types';

export function updateMyMapLocation(latitude: number, longitude: number) {
  return apiRequest<{ ok: boolean }>('/map/me/location', {
    method: 'PUT',
    body: { latitude, longitude },
  });
}

export function listMapUsers() {
  return apiRequest<MapUserPinApi[]>('/map/users');
}
