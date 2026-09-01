import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  DEFAULT_DISCOVER_ADVANCED_FILTERS,
  filterDiscoverPeople,
  mapPinToDiscoverPerson,
  type DiscoverAdvancedFilters,
  type DiscoverAgeFilter,
  type DiscoverDistanceFilter,
  type DiscoverPerson,
  type DiscoverPetTypeFilter,
} from '@/constants/discover';
import { useDiscoveryMap } from '@/hooks/use-discovery-map';
import {
  addToDiscoverBlacklist,
  loadDiscoverBlacklist,
  loadDiscoverPendingConnections,
  markDiscoverPendingConnection,
} from '@/lib/discover-storage';
import * as inboxApi from '@/lib/api/inbox';
import * as moderationApi from '@/lib/api/moderation';
import { CONNECTION_INTENT_FRIENDSHIP } from '@/context/profile-onboarding';

type UseDiscoverPeopleOptions = {
  enabled: boolean;
  search: string;
  ageFilter: DiscoverAgeFilter;
  petTypeFilter: DiscoverPetTypeFilter;
  distanceFilter: DiscoverDistanceFilter;
  advancedFilters: DiscoverAdvancedFilters;
};

export function useDiscoverPeople({
  enabled,
  search,
  ageFilter,
  petTypeFilter,
  distanceFilter,
  advancedFilters,
}: UseDiscoverPeopleOptions) {
  const { permission, users, usersLoading, requestLocationAccess, refreshUsers } =
    useDiscoveryMap(enabled);
  const [blacklist, setBlacklist] = useState<Set<string>>(new Set());
  const [pendingConnections, setPendingConnections] = useState<Set<string>>(new Set());
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    void (async () => {
      const [blocked, pending] = await Promise.all([
        loadDiscoverBlacklist(),
        loadDiscoverPendingConnections(),
      ]);
      setBlacklist(blocked);
      setPendingConnections(pending);
    })();
  }, [enabled]);

  const allPeople = useMemo(() => {
    return users
      .map(mapPinToDiscoverPerson)
      .filter((person): person is DiscoverPerson => person != null);
  }, [users]);

  const excludedIds = useMemo(() => {
    const ids = new Set(blacklist);
    for (const id of pendingConnections) ids.add(id);
    return ids;
  }, [blacklist, pendingConnections]);

  const visiblePeople = useMemo(
    () =>
      filterDiscoverPeople(
        allPeople,
        search,
        ageFilter,
        petTypeFilter,
        distanceFilter,
        advancedFilters,
        excludedIds,
      ),
    [
      allPeople,
      search,
      ageFilter,
      petTypeFilter,
      distanceFilter,
      advancedFilters,
      excludedIds,
    ],
  );

  const excludePerson = useCallback(async (userId: string) => {
    const next = await addToDiscoverBlacklist(userId);
    setBlacklist(next);
    try {
      await moderationApi.blockUser(userId);
      await refreshUsers();
    } catch {
      /* Local hide still applies if the network call fails. */
    }
  }, [refreshUsers]);

  const sendConnection = useCallback(async (userId: string) => {
    setConnectingId(userId);
    try {
      await inboxApi.createConnectionRequest(userId, CONNECTION_INTENT_FRIENDSHIP);
      const next = await markDiscoverPendingConnection(userId);
      setPendingConnections(next);
    } finally {
      setConnectingId(null);
    }
  }, []);

  const isPendingConnection = useCallback(
    (userId: string) => pendingConnections.has(userId),
    [pendingConnections],
  );

  const refreshPeople = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUsers();
    } finally {
      setRefreshing(false);
    }
  }, [refreshUsers]);

  return {
    permission,
    usersLoading,
    requestLocationAccess,
    visiblePeople,
    peopleCount: visiblePeople.length,
    excludePerson,
    sendConnection,
    connectingId,
    isPendingConnection,
    refreshing,
    refreshPeople,
  };
}

export { DEFAULT_DISCOVER_ADVANCED_FILTERS };
export type { DiscoverAdvancedFilters };
