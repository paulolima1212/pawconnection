import * as SplashScreen from 'expo-splash-screen';
import { useEffect, type ReactNode } from 'react';

import { useAuth } from '@/context/auth';
import { useProfileOnboarding } from '@/context/profile-onboarding';

/** Max time to keep the native splash visible before forcing the app UI. */
const SPLASH_FORCE_HIDE_MS = 3_000;

/**
 * Hides the native splash once auth + onboarding storage are hydrated,
 * with a hard timeout so the app never stays stuck on the launch screen.
 */
export function AppReadyGate({ children }: { children: ReactNode }) {
  const { hydrated: authHydrated } = useAuth();
  const { hydrated: profileHydrated } = useProfileOnboarding();

  useEffect(() => {
    if (authHydrated && profileHydrated) {
      void SplashScreen.hideAsync();
    }
  }, [authHydrated, profileHydrated]);

  useEffect(() => {
    const fallback = setTimeout(() => {
      void SplashScreen.hideAsync();
    }, SPLASH_FORCE_HIDE_MS);
    return () => clearTimeout(fallback);
  }, []);

  return children;
}
