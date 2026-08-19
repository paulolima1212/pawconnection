import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { PawColors } from '@/constants/paw-styles';
import { useAuth } from '@/context/auth';
import { useProfileOnboarding } from '@/context/profile-onboarding';

/**
 * App entry: users who finished onboarding go to the feed; new users start at
 * interests → dog profile → owner profile → EasyQR.
 */
export default function IndexScreen() {
  const { hydrated: authHydrated, isAuthenticated } = useAuth();
  const { hydrated, onboardingComplete } = useProfileOnboarding();

  if (!authHydrated || !hydrated) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={PawColors.peachBorder} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth" />;
  }

  if (onboardingComplete) {
    return <Redirect href="/social-feed" />;
  }

  return <Redirect href="/interests" />;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PawColors.creamBg,
  },
});
