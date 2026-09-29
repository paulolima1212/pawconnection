import 'react-native-gesture-handler';
import 'react-native-reanimated';

import * as SplashScreen from 'expo-splash-screen';
import 'expo-router/entry';

/** Safety net if the intro never hides the native splash. */
setTimeout(() => {
  void SplashScreen.hideAsync().catch(() => {});
}, 15_000);
