import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import * as authApi from '@/lib/api/auth';
import { setApiAuthToken, withTimeout } from '@/lib/api/client';
import { safeGetItem, safeRemoveItem, safeSetItem } from '@/lib/safe-async-storage';

const STORAGE_TOKEN = 'paw_auth_token_v1';

type AuthContextValue = {
  hydrated: boolean;
  isAuthenticated: boolean;
  token: string | null;
  userId: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, handle: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await safeGetItem(STORAGE_TOKEN);
        if (cancelled) return;
        if (stored) {
          setToken(stored);
          setApiAuthToken(stored);
          try {
            const me = await withTimeout(authApi.getAuthMe(), 10_000, 'Auth session');
            if (!cancelled) setUserId(me.id);
          } catch {
            await safeRemoveItem(STORAGE_TOKEN);
            if (!cancelled) {
              setToken(null);
              setApiAuthToken(null);
            }
          }
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistToken = useCallback(async (next: string | null) => {
    setToken(next);
    setApiAuthToken(next);
    if (next) {
      await safeSetItem(STORAGE_TOKEN, next);
      const me = await authApi.getAuthMe();
      setUserId(me.id);
    } else {
      await safeRemoveItem(STORAGE_TOKEN);
      setUserId(null);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password });
      await persistToken(res.accessToken);
    },
    [persistToken],
  );

  const register = useCallback(
    async (email: string, password: string, fullName: string, handle: string) => {
      const res = await authApi.register({ email, password, fullName, handle });
      await persistToken(res.accessToken);
    },
    [persistToken],
  );

  const logout = useCallback(async () => {
    await persistToken(null);
  }, [persistToken]);

  const value = useMemo(
    () => ({
      hydrated,
      isAuthenticated: Boolean(token),
      token,
      userId,
      login,
      register,
      logout,
    }),
    [hydrated, token, userId, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
