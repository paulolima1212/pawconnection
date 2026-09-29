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
import { saveLastAccount, type LastAccount } from '@/lib/last-account';
import { clearAuthToken, readAuthToken, writeAuthToken } from '@/lib/secure-token';

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
        const stored = await readAuthToken();
        if (cancelled) return;
        if (stored) {
          setToken(stored);
          setApiAuthToken(stored);
          try {
            const me = await withTimeout(authApi.getAuthMe(), 10_000, 'Auth session');
            if (!cancelled) setUserId(me.id);
          } catch {
            await clearAuthToken();
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

  const persistSession = useCallback(
    async (
      next: string | null,
      account?: { id: string; email?: string | null; fullName: string; photoUrl?: string | null },
    ) => {
      setToken(next);
      setApiAuthToken(next);
      if (next) {
        await writeAuthToken(next);
        if (account?.id) setUserId(account.id);
        if (account?.id && account.email && account.fullName) {
          const remembered: LastAccount = {
            userId: account.id,
            email: account.email,
            displayName: account.fullName,
            photoUrl: account.photoUrl ?? null,
          };
          await saveLastAccount(remembered);
        }
        try {
          const me = await authApi.getAuthMe();
          setUserId(me.id);
        } catch {
          if (!account?.id) {
            throw new Error('Signed in, but the session could not be confirmed.');
          }
        }
      } else {
        await clearAuthToken();
        setUserId(null);
      }
    },
    [],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email: email.trim().toLowerCase(), password });
      await persistSession(res.accessToken, res.user);
    },
    [persistSession],
  );

  const register = useCallback(
    async (email: string, password: string, fullName: string, handle: string) => {
      const res = await authApi.register({
        email: email.trim().toLowerCase(),
        password,
        fullName,
        handle,
      });
      await persistSession(res.accessToken, res.user);
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    await persistSession(null);
  }, [persistSession]);

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
