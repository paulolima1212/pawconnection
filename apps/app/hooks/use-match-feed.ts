import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  mapCandidateToFeedCard,
  type MatchFeedCard,
} from '@/constants/match-feed';
import { useDiscoveryMap } from '@/hooks/use-discovery-map';
import * as matchApi from '@/lib/api/match';

type UseMatchFeedOptions = {
  enabled: boolean;
};

export function useMatchFeed({ enabled }: UseMatchFeedOptions) {
  const { permission, usersLoading, requestLocationAccess } = useDiscoveryMap(enabled);
  const [cards, setCards] = useState<MatchFeedCard[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const fetchCandidates = useCallback(async () => {
    const response = await matchApi.listMatchCandidates({ expandRadius: true });
    const mapped = response.candidates
      .map(mapCandidateToFeedCard)
      .filter((card): card is MatchFeedCard => card != null);
    setCards(mapped);
    setRadiusKm(response.radiusKm);
    setIndex(0);
  }, []);

  useEffect(() => {
    if (!enabled || permission !== 'ready') return;

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        await fetchCandidates();
      } catch {
        if (!cancelled) {
          setCards([]);
          setRadiusKm(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, permission, refreshKey, fetchCandidates]);

  const refreshMatchFeed = useCallback(async () => {
    if (permission !== 'ready') return;
    setRefreshing(true);
    try {
      await fetchCandidates();
    } catch {
      setCards([]);
      setRadiusKm(null);
    } finally {
      setRefreshing(false);
    }
  }, [permission, fetchCandidates]);

  const current = cards[index] ?? null;
  const hasMore = index < cards.length - 1;

  const advance = useCallback(() => {
    setIndex((prev) => {
      if (prev < cards.length - 1) return prev + 1;
      return prev;
    });
  }, [cards.length]);

  const passCurrent = useCallback(async () => {
    if (!current) return;
    const targetId = current.id;
    try {
      await matchApi.passMatchCandidate(targetId);
    } catch {
      /* advance locally anyway */
    }
    setCards((prev) => {
      const next = prev.filter((c) => c.id !== targetId);
      setIndex((i) => Math.min(i, Math.max(0, next.length - 1)));
      return next;
    });
  }, [current]);

  const removeCurrentLocally = useCallback(() => {
    if (!current) return;
    const targetId = current.id;
    setCards((prev) => {
      const next = prev.filter((c) => c.id !== targetId);
      setIndex((i) => Math.min(i, Math.max(0, next.length - 1)));
      return next;
    });
  }, [current]);

  const isBusy = loading || (permission === 'ready' && usersLoading && cards.length === 0);

  return {
    permission,
    requestLocationAccess,
    cards,
    current,
    hasMore,
    index,
    radiusKm,
    loading: isBusy,
    passCurrent,
    advance,
    removeCurrentLocally,
    reload,
    refreshing,
    refreshMatchFeed,
  };
}
