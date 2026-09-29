import { useNavigationContainerRef, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler } from 'react-native';

import { useAuth } from '@/context/auth';
import { useProfileOnboarding } from '@/context/profile-onboarding';
import {
  shouldRedirectCompletedUserFromSignup,
  shouldResetOnboardingBack,
} from '@/lib/navigation/onboarding-back';
import { resetNavigationToHome } from '@/lib/navigation/reset-to-home';

/** After registration, back must land on home instead of the signup screens. */
export function OnboardingBackGuard() {
  const pathname = usePathname();
  const navigation = useNavigationContainerRef();
  const { isAuthenticated } = useAuth();
  const { hydrated, onboardingComplete } = useProfileOnboarding();

  useEffect(() => {
    if (!hydrated) return;
    if (!shouldRedirectCompletedUserFromSignup(isAuthenticated, onboardingComplete, pathname)) {
      return;
    }
    resetNavigationToHome(navigation);
  }, [hydrated, isAuthenticated, navigation, onboardingComplete, pathname]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!isAuthenticated || !shouldResetOnboardingBack(onboardingComplete, navigation.getRootState())) {
        return false;
      }
      resetNavigationToHome(navigation);
      return true;
    });
    return () => subscription.remove();
  }, [isAuthenticated, navigation, onboardingComplete]);

  return null;
}
