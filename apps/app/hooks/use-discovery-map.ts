import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import * as mapApi from '@/lib/api/map';
import type { MapUserPinApi } from '@/lib/api/types';

export type DiscoveryMapPermission = 'loading' | 'ready' | 'blocked';

const LOCATION_PUSH_MS = 25_000;
const USERS_POLL_MS = 12_000;
const GPS_TIMEOUT_MS = 12_000;

export type MapCoords = { latitude: number; longitude: number };

function canUseDeviceLocation(): boolean {
  return (
    Platform.OS !== 'web' &&
    typeof Location.requestForegroundPermissionsAsync === 'function'
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

async function readDeviceCoords(): Promise<MapCoords> {
  const lastKnown = await Location.getLastKnownPositionAsync();
  if (lastKnown) {
    return {
      latitude: lastKnown.coords.latitude,
      longitude: lastKnown.coords.longitude,
    };
  }
  const pos = await withTimeout(
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    GPS_TIMEOUT_MS,
    'GPS timeout',
  );
  return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
}

export function useDiscoveryMap(enabled: boolean) {
  const [permission, setPermission] = useState<DiscoveryMapPermission>('loading');
  const [myCoords, setMyCoords] = useState<MapCoords | null>(null);
  const [users, setUsers] = useState<MapUserPinApi[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const myCoordsRef = useRef<MapCoords | null>(null);
  const enabledRef = useRef(enabled);
  const pushInFlightRef = useRef(false);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const pushLocationToServer = useCallback(async (coords: MapCoords) => {
    if (pushInFlightRef.current) return;
    pushInFlightRef.current = true;
    try {
      await mapApi.updateMyMapLocation(coords.latitude, coords.longitude);
    } catch {
      /* best effort */
    } finally {
      pushInFlightRef.current = false;
    }
  }, []);

  const refreshUsers = useCallback(async () => {
    if (!enabledRef.current) return;
    setUsersLoading(true);
    try {
      const list = await mapApi.listMapUsers();
      if (enabledRef.current) setUsers(list);
    } catch {
      if (enabledRef.current) setUsers([]);
    } finally {
      if (enabledRef.current) setUsersLoading(false);
    }
  }, []);

  const syncMyPosition = useCallback(async () => {
    if (!canUseDeviceLocation()) {
      setPermission('blocked');
      return null;
    }
    const coords = await readDeviceCoords();
    myCoordsRef.current = coords;
    setMyCoords(coords);
    setPermission('ready');
    await pushLocationToServer(coords);
    return coords;
  }, [pushLocationToServer]);

  const requestLocationAccess = useCallback(async (): Promise<boolean> => {
    setPermission('loading');
    try {
      if (!canUseDeviceLocation()) {
        setPermission('blocked');
        return false;
      }
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const requested = await Location.requestForegroundPermissionsAsync();
        status = requested.status;
      }
      if (status !== 'granted') {
        setPermission('blocked');
        return false;
      }
      await syncMyPosition();
      return true;
    } catch {
      setPermission('blocked');
      return false;
    }
  }, [syncMyPosition]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    (async () => {
      if (!canUseDeviceLocation()) {
        if (!cancelled) setPermission('blocked');
        return;
      }
      setPermission('loading');
      const { status } = await Location.getForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== 'granted') {
        const requested = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (requested.status !== 'granted') {
          setPermission('blocked');
          return;
        }
      }
      try {
        await syncMyPosition();
        if (!cancelled) void refreshUsers();
      } catch {
        if (!cancelled) setPermission('blocked');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, syncMyPosition, refreshUsers]);

  useEffect(() => {
    if (!enabled || permission !== 'ready') return;

    const locationTimer = setInterval(() => {
      void syncMyPosition();
    }, LOCATION_PUSH_MS);

    const usersTimer = setInterval(() => {
      void refreshUsers();
    }, USERS_POLL_MS);

    return () => {
      clearInterval(locationTimer);
      clearInterval(usersTimer);
    };
  }, [enabled, permission, syncMyPosition, refreshUsers]);

  useEffect(() => {
    if (!enabled) return;

    const onAppState = (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        const coords = myCoordsRef.current;
        if (coords) void pushLocationToServer(coords);
      }
    };

    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, [enabled, pushLocationToServer]);

  useEffect(() => {
    if (enabled) return;
    const coords = myCoordsRef.current;
    if (coords) void pushLocationToServer(coords);
  }, [enabled, pushLocationToServer]);

  return {
    permission,
    myCoords,
    users,
    usersLoading,
    requestLocationAccess,
    refreshUsers,
  };
}
