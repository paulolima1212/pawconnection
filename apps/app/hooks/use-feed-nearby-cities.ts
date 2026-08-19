import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import type { FeedRadiusKm } from '@/constants/feed-discovery-filters';

export type FeedCityPermissionState = 'loading' | 'ready' | 'blocked';

export type FeedCityBlockedReason = 'permission' | 'geocode';

export type FeedCityOption = { value: string; label: string };

const KM_PER_DEG_LAT = 110.574;
const GPS_TIMEOUT_MS = 12_000;
const GEOCODE_TIMEOUT_MS = 8_000;

function canUseDeviceLocation(): boolean {
  return (
    Platform.OS !== 'web' &&
    typeof Location.requestForegroundPermissionsAsync === 'function' &&
    typeof Location.getForegroundPermissionsAsync === 'function'
  );
}

type GeoSample = { dLat: number; dLng: number; distKm: number };

function kmToDeltaDegrees(northKm: number, eastKm: number, latDegrees: number): { dLat: number; dLng: number } {
  const dLat = northKm / KM_PER_DEG_LAT;
  const cosLat = Math.cos((latDegrees * Math.PI) / 180);
  const denom = Math.max(0.25, 111.32 * cosLat);
  const dLng = eastKm / denom;
  return { dLat, dLng };
}

const BEARINGS_DEG = [0, 45, 90, 135, 180, 225, 270, 315];

function distanceFractionsForRadius(radiusKm: number): number[] {
  if (radiusKm <= 2) return [0, 1];
  if (radiusKm <= 10) return [0, 0.5, 1];
  return [0, 0.33, 0.66, 1];
}

function buildSamplesForRadius(radiusKm: number, lat: number): GeoSample[] {
  const fractions = distanceFractionsForRadius(radiusKm);
  const distsKm = [...new Set(fractions.map((f) => Math.round(f * radiusKm * 1000) / 1000))].sort(
    (a, b) => a - b,
  );

  const raw: GeoSample[] = [];
  for (const dKm of distsKm) {
    if (dKm <= 0) {
      raw.push({ dLat: 0, dLng: 0, distKm: 0 });
      continue;
    }
    for (const deg of BEARINGS_DEG) {
      const rad = (deg * Math.PI) / 180;
      const northKm = dKm * Math.cos(rad);
      const eastKm = dKm * Math.sin(rad);
      const { dLat, dLng } = kmToDeltaDegrees(northKm, eastKm, lat);
      raw.push({ dLat, dLng, distKm: dKm });
    }
  }

  const seen = new Set<string>();
  const out: GeoSample[] = [];
  for (const s of raw) {
    const key = `${s.dLat.toFixed(5)},${s.dLng.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

function localityFromGeo(geo: Location.LocationGeocodedAddress): string | null {
  const district = geo.district?.trim();
  if (district) return district;

  const city = geo.city?.trim();
  const subregion = geo.subregion?.trim();
  if (subregion && subregion !== city) return subregion;
  if (city) return city;

  const name = geo.name?.trim();
  if (name && name.length > 2 && !/^\d/.test(name)) return name;

  const region = geo.region?.trim();
  if (region && region.length > 2) return region;

  return null;
}

async function reverseSample(lat: number, lng: number): Promise<string | null> {
  try {
    const list = await withTimeout(
      Location.reverseGeocodeAsync({ latitude: lat, longitude: lng }),
      GEOCODE_TIMEOUT_MS,
      'Geocode timeout',
    );
    const geo = list[0];
    if (!geo) return null;
    return localityFromGeo(geo);
  } catch {
    return null;
  }
}

async function resolveUserPosition(): Promise<{ lat: number; lng: number }> {
  const lastKnown = await Location.getLastKnownPositionAsync();
  if (lastKnown) {
    return { lat: lastKnown.coords.latitude, lng: lastKnown.coords.longitude };
  }

  const pos = await withTimeout(
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    GPS_TIMEOUT_MS,
    'GPS timeout',
  );
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await mapper(items[current]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

async function collectLocalitiesAroundUser(
  lat: number,
  lng: number,
  radiusKm: number,
): Promise<FeedCityOption[]> {
  const samples = buildSamplesForRadius(radiusKm, lat);
  const minDistByName = new Map<string, number>();
  const insertOrder = new Map<string, number>();
  let order = 0;

  const labels = await mapWithConcurrency(samples, 4, async (s) => ({
    label: await reverseSample(lat + s.dLat, lng + s.dLng),
    distKm: s.distKm,
  }));

  for (const { label, distKm } of labels) {
    if (!label) continue;
    const prev = minDistByName.get(label);
    if (prev === undefined || distKm < prev) {
      minDistByName.set(label, distKm);
    }
    if (!insertOrder.has(label)) {
      insertOrder.set(label, order);
      order += 1;
    }
  }

  const entries = [...minDistByName.entries()].sort((a, b) => {
    if (a[1] !== b[1]) return a[1] - b[1];
    return (insertOrder.get(a[0]) ?? 0) - (insertOrder.get(b[0]) ?? 0);
  });

  return entries.map(([name]) => ({ value: name, label: name }));
}

export function useFeedNearbyCities(radiusKm: FeedRadiusKm) {
  const [permission, setPermission] = useState<FeedCityPermissionState>('loading');
  const [blockedReason, setBlockedReason] = useState<FeedCityBlockedReason | undefined>();
  const [cityOptions, setCityOptions] = useState<FeedCityOption[]>([]);
  const [citiesRefreshing, setCitiesRefreshing] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const positionRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const radiusNum = Number.parseInt(radiusKm, 10) || 2;

    (async () => {
      const hasPosition = positionRef.current !== null;
      if (hasPosition) {
        setCitiesRefreshing(true);
      } else {
        setPermission('loading');
        setCitiesRefreshing(false);
      }

      setBlockedReason(undefined);

      let resolvedPrimary: string | null = null;

      try {
        if (!canUseDeviceLocation()) {
          setBlockedReason('permission');
          setPermission('blocked');
          setCityOptions([]);
          return;
        }

        if (!positionRef.current) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (cancelled) return;
          if (status !== 'granted') {
            setBlockedReason('permission');
            setPermission('blocked');
            setCityOptions([]);
            return;
          }

          const pos = await resolveUserPosition();
          if (cancelled) return;
          positionRef.current = pos;
        }

        const { lat, lng } = positionRef.current!;

        resolvedPrimary = await reverseSample(lat, lng);
        if (cancelled) return;

        if (resolvedPrimary) {
          setCityOptions([{ value: resolvedPrimary, label: resolvedPrimary }]);
          setPermission('ready');
          setBlockedReason(undefined);
        }

        setCitiesRefreshing(true);
        const options = await collectLocalitiesAroundUser(lat, lng, radiusNum);
        if (cancelled) return;

        if (options.length === 0) {
          if (resolvedPrimary) return;
          setBlockedReason('geocode');
          setPermission('blocked');
          setCityOptions([]);
          return;
        }

        setCityOptions(options);
        setBlockedReason(undefined);
        setPermission('ready');
      } catch {
        if (!cancelled && !resolvedPrimary) {
          setBlockedReason('geocode');
          setPermission('blocked');
          setCityOptions([]);
        }
      } finally {
        if (!cancelled) setCitiesRefreshing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [radiusKm, sessionKey]);

  const refetch = useCallback(() => {
    positionRef.current = null;
    setSessionKey((k) => k + 1);
  }, []);

  const requestLocationAccess = useCallback(async (): Promise<boolean> => {
    setPermission('loading');
    setBlockedReason(undefined);
    setCitiesRefreshing(false);

    try {
      if (!canUseDeviceLocation()) {
        setBlockedReason('permission');
        setPermission('blocked');
        setCityOptions([]);
        return false;
      }

      let { status } = await Location.getForegroundPermissionsAsync();

      if (status !== 'granted') {
        const requested = await Location.requestForegroundPermissionsAsync();
        status = requested.status;
      }

      if (status !== 'granted') {
        setBlockedReason('permission');
        setPermission('blocked');
        setCityOptions([]);
        return false;
      }

      positionRef.current = null;
      setBlockedReason(undefined);
      setSessionKey((k) => k + 1);
      return true;
    } catch {
      setBlockedReason('geocode');
      setPermission('blocked');
      setCityOptions([]);
      return false;
    }
  }, []);

  return {
    permission,
    blockedReason,
    cityOptions,
    citiesRefreshing,
    refetch,
    requestLocationAccess,
    refetchNearbyCities: refetch,
  };
}
