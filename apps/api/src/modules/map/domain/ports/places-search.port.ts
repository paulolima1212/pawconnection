export const PLACES_SEARCH = Symbol('PLACES_SEARCH');

export type NearbyPlaceHit = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  types: string[];
  primaryType: string | null;
  allowsDogs: boolean | null;
  address: string | null;
};

export type NearbyPlacesQuery = {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  includedTypes: readonly string[];
};

export interface IPlacesSearch {
  searchNearby(query: NearbyPlacesQuery): Promise<NearbyPlaceHit[]>;
}
