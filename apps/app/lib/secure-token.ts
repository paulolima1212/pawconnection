import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { safeGetItem, safeRemoveItem, safeSetItem } from '@/lib/safe-async-storage';

const LEGACY_TOKEN_KEY = 'paw_auth_token_v1';
const SECURE_TOKEN_KEY = 'paw_auth_token_v1';

async function canUseSecureStore(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function readAuthToken(): Promise<string | null> {
  if (await canUseSecureStore()) {
    try {
      const secure = await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
      if (secure) return secure;
    } catch {
      /* fall through to legacy storage */
    }
  }

  const legacy = await safeGetItem(LEGACY_TOKEN_KEY);
  if (legacy && (await canUseSecureStore())) {
    await writeAuthToken(legacy);
    await safeRemoveItem(LEGACY_TOKEN_KEY);
  }
  return legacy;
}

export async function writeAuthToken(token: string): Promise<void> {
  if (await canUseSecureStore()) {
    await SecureStore.setItemAsync(SECURE_TOKEN_KEY, token);
    await safeRemoveItem(LEGACY_TOKEN_KEY);
    return;
  }
  await safeSetItem(LEGACY_TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  if (await canUseSecureStore()) {
    try {
      await SecureStore.deleteItemAsync(SECURE_TOKEN_KEY);
    } catch {
      /* already gone */
    }
  }
  await safeRemoveItem(LEGACY_TOKEN_KEY);
}
