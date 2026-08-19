import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Mirrors persisted keys in memory so onboarding still works when the native
 * AsyncStorage module is unavailable (e.g. certain Expo Go / web setups).
 */
const memory = new Map<string, string>();

export async function safeGetItem(key: string): Promise<string | null> {
  try {
    const v = await AsyncStorage.getItem(key);
    if (v != null) memory.set(key, v);
    else memory.delete(key);
    return v;
  } catch {
    return memory.get(key) ?? null;
  }
}

export async function safeSetItem(key: string, value: string): Promise<void> {
  memory.set(key, value);
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    /* native unavailable; memory-only */
  }
}

export async function safeRemoveItem(key: string): Promise<void> {
  memory.delete(key);
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    /* noop */
  }
}
