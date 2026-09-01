import { safeGetItem, safeSetItem } from '@/lib/safe-async-storage';

const BLACKLIST_KEY = 'paw_discover_blacklist_v1';
const PENDING_KEY = 'paw_discover_pending_v1';

async function readIdSet(key: string): Promise<Set<string>> {
  const raw = await safeGetItem(key);
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

async function writeIdSet(key: string, ids: Set<string>): Promise<void> {
  await safeSetItem(key, JSON.stringify([...ids]));
}

export async function loadDiscoverBlacklist(): Promise<Set<string>> {
  return readIdSet(BLACKLIST_KEY);
}

export async function addToDiscoverBlacklist(userId: string): Promise<Set<string>> {
  const ids = await loadDiscoverBlacklist();
  ids.add(userId);
  await writeIdSet(BLACKLIST_KEY, ids);
  return ids;
}

export async function loadDiscoverPendingConnections(): Promise<Set<string>> {
  return readIdSet(PENDING_KEY);
}

export async function markDiscoverPendingConnection(userId: string): Promise<Set<string>> {
  const ids = await loadDiscoverPendingConnections();
  ids.add(userId);
  await writeIdSet(PENDING_KEY, ids);
  return ids;
}

/**
 * Local hide list used as an optimistic cache. Discover exclude now also
 * calls POST /users/:id/block so blocked people disappear from map, feed,
 * match, and chat.
 */
