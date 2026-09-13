import { useCallback, useEffect, useRef, useState } from 'react';

import { radiusKmForPlacesRequest, type MapPlaceFilter } from '@/constants/map-place-filters';
import * as mapApi from '@/lib/api/map';
import type { MapPlacePinApi } from '@/lib/api/types';
import type { MapCoords } from '@/hooks/use-discovery-map';

export function useDogFriendlyPlaces(input: {
  enabled: boolean;
  coords: MapCoords | null;
  radiusKm: string;
  category: MapPlaceFilter;
}) {
  const [places, setPlaces] = useState<MapPlacePinApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [appliedRadiusKm, setAppliedRadiusKm] = useState<number | null>(null);
  const enabledRef = useRef(input.enabled);

  useEffect(() => {
    enabledRef.current = input.enabled;
  }, [input.enabled]);

  const refresh = useCallback(async () => {
    if (!input.enabled || !input.coords) return;
    setLoading(true);
    try {
      const result = await mapApi.listDogFriendlyPlaces({
        latitude: input.coords.latitude,
        longitude: input.coords.longitude,
        radiusKm: input.radiusKm,
        category: input.category,
      });
      if (!enabledRef.current) return;
      setPlaces(result.items);
      setAppliedRadiusKm(result.radiusKm);
    } catch {
      if (enabledRef.current) {
        setPlaces([]);
        setAppliedRadiusKm(radiusKmForPlacesRequest(input.radiusKm) ?? 5);
      }
    } finally {
      if (enabledRef.current) setLoading(false);
    }
  }, [
    input.enabled,
    input.coords?.latitude,
    input.coords?.longitude,
    input.radiusKm,
    input.category,
  ]);

  useEffect(() => {
    if (!input.enabled || !input.coords) {
      setPlaces([]);
      return;
    }
    void refresh();
  }, [input.enabled, input.coords, refresh]);

  return { places, loading, appliedRadiusKm, refresh };
}
