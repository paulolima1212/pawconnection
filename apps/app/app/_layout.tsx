import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppReadyGate } from '@/components/app-ready-gate';
import { ChatActivityListener } from '@/components/chat-activity-listener';
import { PawColors, PawLayout } from '@/constants/paw-styles';
import { AuthProvider } from '@/context/auth';
import { FeedPostsProvider } from '@/context/feed-posts';
import { InboxUnreadProvider } from '@/context/inbox-unread';
import { PawTooltipProvider } from '@/context/paw-tooltip';
import { ProfileOnboardingProvider } from '@/context/profile-onboarding';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
    <AuthProvider>
      <InboxUnreadProvider>
      <PawTooltipProvider>
        <ChatActivityListener />
        <ProfileOnboardingProvider>
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
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
