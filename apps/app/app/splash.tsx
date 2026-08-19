import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PawLogo } from '@/components/paw/paw-logo';
import { PawColors, PawFontSize, PawLayout } from '@/constants/paw-styles';
import { useAuth } from '@/context/auth';

const AUTO_ADVANCE_MS = 2800;

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAuth();

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      if (isAuthenticated) router.replace('/');
      else router.replace('/auth' as '/');
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [router, isAuthenticated, hydrated]);

  const skip = () => {
    if (isAuthenticated) router.replace('/');
    else router.replace('/auth' as '/');
  };

  return (
    <Pressable style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]} onPress={skip}>
      <View style={styles.center}>
        <PawLogo variant="splash" />
        <Text style={styles.hint}>Tap to continue</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PawColors.creamBg,
    maxWidth: PawLayout.screenMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  hint: {
    fontSize: PawFontSize.small,
    fontWeight: '300',
    color: PawColors.textMuted,
  },
});
