import { safeGetItem, safeRemoveItem, safeSetItem } from '@/lib/safe-async-storage';
import {
  parseLastAccount,
  serializeLastAccount,
  type LastAccount,
} from '@/lib/last-account-record';

export type { LastAccount } from '@/lib/last-account-record';

const STORAGE_KEY = 'paw_last_account_v1';

export async function loadLastAccount(): Promise<LastAccount | null> {
  return parseLastAccount(await safeGetItem(STORAGE_KEY));
}

export async function saveLastAccount(account: LastAccount): Promise<void> {
  const payload = parseLastAccount(serializeLastAccount(account));
  if (!payload) return;
  await safeSetItem(STORAGE_KEY, serializeLastAccount(payload));
}

export async function clearLastAccount(): Promise<void> {
  await safeRemoveItem(STORAGE_KEY);
}
