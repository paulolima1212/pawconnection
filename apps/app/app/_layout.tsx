import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppReadyGate } from '@/components/app-ready-gate';
import { OnboardingBackGuard } from '@/components/onboarding-back-guard';
import { ChatActivityListener } from '@/components/chat-activity-listener';
import { IntroAnimation } from '@/components/paw/intro-animation';
import { PawColors, PawLayout } from '@/constants/paw-styles';
import { AuthProvider } from '@/context/auth';
import { FeedPostsProvider } from '@/context/feed-posts';
import { InboxUnreadProvider } from '@/context/inbox-unread';
import { PawTooltipProvider } from '@/context/paw-tooltip';
import { ProfileOnboardingProvider } from '@/context/profile-onboarding';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  INTRO_SHOWN_ON_KEY,
  introDayKey,
  isFreshProcess,
  markIntroSettledThisProcess,
  shouldShowStartupIntro,
} from '@/lib/intro-schedule';
import { safeGetItem, safeSetItem } from '@/lib/safe-async-storage';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [introVisible, setIntroVisible] = useState(isFreshProcess);

  useEffect(() => {
    const today = introDayKey(new Date());
    if (isFreshProcess()) {
      void safeSetItem(INTRO_SHOWN_ON_KEY, today);
      return;
    }

    let cancelled = false;
    void (async () => {
      const lastShownDay = await safeGetItem(INTRO_SHOWN_ON_KEY);
      if (cancelled) return;
      if (shouldShowStartupIntro(false, lastShownDay, today)) {
        await safeSetItem(INTRO_SHOWN_ON_KEY, today);
        if (!cancelled) setIntroVisible(true);
        return;
      }
      void SplashScreen.hideAsync().catch(() => {});
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active' || isFreshProcess()) return;
      const today = introDayKey(new Date());
      void (async () => {
        const lastShownDay = await safeGetItem(INTRO_SHOWN_ON_KEY);
        if (!shouldShowStartupIntro(false, lastShownDay, today)) return;
        await safeSetItem(INTRO_SHOWN_ON_KEY, today);
        setIntroVisible(true);
      })();
    });
    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
    <AuthProvider>
      <InboxUnreadProvider>
      <PawTooltipProvider>
        <ChatActivityListener />
        <ProfileOnboardingProvider>
          <OnboardingBackGuard />
          <FeedPostsProvider>
            <AppReadyGate>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: PawColors.creamBg,
                  flex: 1,
                  width: '100%',
                  maxWidth: PawLayout.screenMaxWidth,
                  alignSelf: 'center',
                },
                animation: 'slide_from_right',
              }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(main)" options={{ animation: 'none' }} />
              <Stack.Screen name="auth" />
              <Stack.Screen name="forgot-password" />
              <Stack.Screen name="reset-password" />
              <Stack.Screen name="interests" />
              <Stack.Screen name="splash" />
              <Stack.Screen name="setup-you" />
              <Stack.Screen name="setup-dog" />
              <Stack.Screen name="new-post" />
              <Stack.Screen name="user/[handle]" />
              <Stack.Screen name="chat/[conversationId]" />
              <Stack.Screen name="easy-qr" />
            </Stack>
            <StatusBar style="dark" />
            </ThemeProvider>
            </AppReadyGate>
          </FeedPostsProvider>
        </ProfileOnboardingProvider>
      </PawTooltipProvider>
      </InboxUnreadProvider>
    </AuthProvider>
    {introVisible ? (
      <IntroAnimation
        onFinish={() => {
          markIntroSettledThisProcess();
          setIntroVisible(false);
        }}
      />
    ) : null}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFAF6',
  },
});
