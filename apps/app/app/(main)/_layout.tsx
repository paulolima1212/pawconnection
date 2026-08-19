import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { MainTabShell } from '@/components/paw/main-tab-shell';
import { MainTabNavProvider } from '@/context/main-tab-nav';
import { PawColors, PawLayout } from '@/constants/paw-styles';

export const unstable_settings = {
  initialRouteName: 'social-feed',
};

/**
 * Tab screens are rendered inside MainTabShell (horizontal pager).
 * The nested Stack only registers URLs; its scenes are collapsed so they
 * do not cover the pager or leave a blank band above the tab bar.
 */
export default function MainLayout() {
  return (
    <MainTabNavProvider>
      <View style={styles.root}>
        <View style={styles.mainShell}>
          <MainTabShell />
        </View>
        <View style={styles.routeHost} pointerEvents="none">
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'none',
              contentStyle: styles.hiddenRoute,
            }}
          />
        </View>
      </View>
    </MainTabNavProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PawColors.creamBg,
    alignItems: 'center',
  },
  mainShell: {
    flex: 1,
    width: '100%',
    maxWidth: PawLayout.screenMaxWidth,
  },
  routeHost: {
    ...StyleSheet.absoluteFillObject,
    width: 0,
    height: 0,
    overflow: 'hidden',
    opacity: 0,
  },
  hiddenRoute: {
    flex: 0,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
  },
});
