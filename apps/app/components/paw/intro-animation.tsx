import LottieView from 'lottie-react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  INTRO_DURATION_MS,
  INTRO_FAILSAFE_MS,
  shouldCompleteIntro,
} from '@/lib/intro-playback';

const INTRO_SOURCE = require('@/assets/lottie/paw-connection-intro.lottie.json');
const INTRO_BACKGROUND = '#FFFAF6';

type IntroAnimationProps = {
  onFinish: () => void;
};

export function IntroAnimation({ onFinish }: IntroAnimationProps) {
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const finished = useRef(false);
  const mounted = useRef(true);
  const loadedAt = useRef<number | null>(null);
  const completionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = useCallback(() => {
    if (finished.current || !mounted.current) return;
    finished.current = true;
    if (completionTimer.current) {
      clearTimeout(completionTimer.current);
      completionTimer.current = null;
    }
    void SplashScreen.hideAsync().catch(() => {});
    onFinishRef.current();
  }, []);

  useEffect(() => {
    mounted.current = true;
    const failSafe = setTimeout(finish, INTRO_FAILSAFE_MS);
    return () => {
      mounted.current = false;
      clearTimeout(failSafe);
      if (completionTimer.current) {
        clearTimeout(completionTimer.current);
        completionTimer.current = null;
      }
    };
  }, [finish]);

  const onLoaded = useCallback(() => {
    if (loadedAt.current != null) return;
    loadedAt.current = Date.now();
    void SplashScreen.hideAsync().catch(() => {});
    completionTimer.current = setTimeout(finish, INTRO_DURATION_MS + 400);
  }, [finish]);

  const onFailure = useCallback(() => {
    finish();
  }, [finish]);

  const onAnimationFinish = useCallback(
    (cancelled: boolean) => {
      const started = loadedAt.current;
      const elapsed = started == null ? 0 : Date.now() - started;
      if (!shouldCompleteIntro(elapsed, cancelled)) return;
      finish();
    },
    [finish],
  );

  return (
    <View style={styles.root} accessibilityRole="image" accessibilityLabel="Paw Connection">
      <LottieView
        source={INTRO_SOURCE}
        autoPlay
        loop={false}
        resizeMode="contain"
        renderMode="SOFTWARE"
        hardwareAccelerationAndroid={false}
        cacheComposition
        onAnimationLoaded={onLoaded}
        onAnimationFailure={onFailure}
        onAnimationFinish={onAnimationFinish}
        style={styles.animation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    elevation: 50,
    backgroundColor: INTRO_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width: '100%',
    aspectRatio: 1,
  },
});
