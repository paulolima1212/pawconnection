import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/paw/bottom-tab-bar';
import { DiscoverScreen } from '@/components/screens/discover-screen';
import { InboxScreen } from '@/components/screens/inbox-screen';
import { MatchFeedScreen } from '@/components/screens/match-feed-screen';
import { ProfileScreen } from '@/components/screens/profile-screen';
import { SocialFeedScreen } from '@/components/screens/social-feed-screen';
import { MAIN_TAB_PAGE_ORDER, useMainTabNav } from '@/context/main-tab-nav';
import { PawColors, PawLayout } from '@/constants/paw-styles';
import { useContentWidth } from '@/hooks/use-content-width';

const PAGE_SCREENS = [
  SocialFeedScreen,
  MatchFeedScreen,
  DiscoverScreen,
  InboxScreen,
  ProfileScreen,
] as const;

export function MainTabShell() {
  const insets = useSafeAreaInsets();
  const contentWidth = useContentWidth();
  const { pageWidth, translateX } = useMainTabNav();
  const width = pageWidth > 0 ? pageWidth : contentWidth;
  const stripStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (width <= 0) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <View style={styles.pagerClip}>
        <Animated.View
          style={[
            styles.strip,
            { width: width * MAIN_TAB_PAGE_ORDER.length },
            stripStyle,
          ]}>
          {PAGE_SCREENS.map((Screen, index) => (
            <View key={MAIN_TAB_PAGE_ORDER[index]} style={[styles.page, { width }]}>
              <Screen />
            </View>
          ))}
        </Animated.View>
      </View>
      <View style={[styles.tabBarWrap, { paddingBottom: insets.bottom }]}>
        <BottomTabBar />
      </View>
    </View>
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
  pagerClip: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: PawColors.creamBg,
  },
  strip: {
    flex: 1,
    flexDirection: 'row',
  },
  page: {
    flex: 1,
    backgroundColor: PawColors.creamBg,
  },
  tabBarWrap: {
    backgroundColor: PawColors.peach,
  },
});
