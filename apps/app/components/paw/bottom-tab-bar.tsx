import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PawColors, PawFontSize, PawLineHeight } from '@/constants/paw-styles';
import { useInboxUnread } from '@/context/inbox-unread';
import { useMainTabNav } from '@/context/main-tab-nav';

export type PawTabId = 'home' | 'find' | 'discover' | 'inbox' | 'profile';

type TabItem = {
  id: PawTabId;
  label: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  route: Href;
};

const ICON_BOX = 28;
const ICON_SIZE_ACTIVE = 24;
const ICON_SIZE_INACTIVE = 20;
const INACTIVE_ICON_OPACITY = 0.52;

const TAB_ITEMS: TabItem[] = [
  { id: 'home', label: 'Home', icon: 'dog-side', route: '/social-feed' },
  { id: 'find', label: 'Find', icon: 'account-group-outline', route: '/match-feed' as Href },
  { id: 'discover', label: 'Discover', icon: 'magnify', route: '/discover' as Href },
  { id: 'inbox', label: 'Inbox', icon: 'message-text-outline', route: '/inbox' as Href },
  { id: 'profile', label: 'Profile', icon: 'account-circle-outline', route: '/profile' as Href },
];

export function BottomTabBar() {
  const { activeTab: currentTab, goToTab } = useMainTabNav();
  const { totalUnread } = useInboxUnread();

  return (
    <View style={styles.bar}>
      {TAB_ITEMS.map((item) => {
        const active = item.id === currentTab;
        const iconColor = active ? PawColors.navLabelActive : PawColors.navLabel;
        const iconSize = active ? ICON_SIZE_ACTIVE : ICON_SIZE_INACTIVE;
        const showInboxBadge = item.id === 'inbox' && totalUnread > 0;
        return (
          <Pressable
            key={item.id}
            onPress={() => {
              if (currentTab !== item.id) {
                goToTab(item.id);
              }
            }}
            style={styles.item}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={
              showInboxBadge ? `${item.label}, ${totalUnread} unread messages` : item.label
            }>
            <View style={[styles.iconBox, !active && styles.iconInactive]}>
              <MaterialCommunityIcons name={item.icon} size={iconSize} color={iconColor} />
              {showInboxBadge ? (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={styles.labelBox}>
              <Text
                style={[styles.label, !active && styles.labelInactive, active && styles.labelActive]}
                numberOfLines={1}
                ellipsizeMode="clip"
                adjustsFontSizeToFit
                minimumFontScale={0.72}
                maxFontSizeMultiplier={1.2}>
                {item.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PawColors.peach,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    minHeight: 62,
  },
  item: {
    flex: 1,
    minWidth: 0,
    maxWidth: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  iconInactive: {
    opacity: INACTIVE_ICON_OPACITY,
  },
  iconBox: {
    width: ICON_BOX,
    height: ICON_BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: PawColors.black,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: PawColors.whiteCard,
    lineHeight: 11,
  },
  labelBox: {
    width: '100%',
    maxWidth: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    width: '100%',
    textAlign: 'center',
    fontSize: PawFontSize.caption,
    fontWeight: '500',
    color: PawColors.navLabel,
    letterSpacing: -0.15,
    lineHeight: PawLineHeight.caption,
  },
  labelInactive: {
    opacity: INACTIVE_ICON_OPACITY,
  },
  labelActive: {
    fontWeight: '800',
    color: PawColors.navLabelActive,
  },
});
