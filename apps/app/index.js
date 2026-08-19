import 'react-native-gesture-handler';
import 'react-native-reanimated';

import * as SplashScreen from 'expo-splash-screen';
import 'expo-router/entry';

/** Safety net if root layout never mounts (e.g. slow bootstrap). */
setTimeout(() => {
  void SplashScreen.hideAsync().catch(() => {});
}, 4_000);
