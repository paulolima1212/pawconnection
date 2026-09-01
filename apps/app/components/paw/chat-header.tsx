import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ChatUserSummary } from '@/lib/api/chat';
import { resolveMediaDisplayUrl } from '@/lib/api/media';
import { ownerFirstName } from '@/lib/chat/message-utils';
import { PawColors, PawFontSize, PawLayout } from '@/constants/paw-styles';

const FALLBACK_AVATAR = require('@/assets/inbox/human-avatar.png');

type ChatHeaderProps = {
  otherUser: ChatUserSummary | null;
  connected: boolean;
  onBack: () => void;
  onPressProfile?: () => void;
  onPressMore?: () => void;
};

export function ChatHeader({
  otherUser,
  connected,
  onBack,
  onPressProfile,
  onPressMore,
}: ChatHeaderProps) {
  const photoUri = resolveMediaDisplayUrl(otherUser?.photoUrl);
  const title = otherUser ? ownerFirstName(otherUser.fullName) : 'Chat';

  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
        <Text style={styles.backIcon}>←</Text>
      </Pressable>
      <Pressable
        style={styles.profileTap}
        onPress={onPressProfile}
        disabled={!onPressProfile || !otherUser}
        accessibilityRole="button"
        accessibilityLabel={otherUser ? `Open ${otherUser.fullName}'s profile` : 'Chat header'}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.avatar} contentFit="cover" />
        ) : (
          <Image source={FALLBACK_AVATAR} style={styles.avatar} contentFit="cover" />
        )}
        <View style={styles.titleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          {otherUser?.petName ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              with {otherUser.petName}
            </Text>
          ) : null}
        </View>
      </Pressable>
      {onPressMore ? (
        <Pressable
          onPress={onPressMore}
          hitSlop={12}
          style={styles.moreBtn}
          accessibilityRole="button"
          accessibilityLabel="Chat options">
          <Text style={styles.moreIcon}>⋮</Text>
        </Pressable>
      ) : (
        <View style={styles.statusDot}>
          <View style={[styles.dot, connected ? styles.dotOn : styles.dotOff]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PawLayout.horizontalPadding,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: PawColors.profileHeaderBorder,
    backgroundColor: PawColors.creamBg,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: PawColors.black,
  },
  profileTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PawColors.black,
    backgroundColor: PawColors.fieldGray,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  headerTitle: {
    fontSize: PawFontSize.subtitle,
    fontWeight: '700',
    color: PawColors.black,
  },
  subtitle: {
    fontSize: PawFontSize.caption,
    fontWeight: '300',
    color: PawColors.textMuted,
  },
  statusDot: {
    width: 24,
    alignItems: 'center',
  },
  moreBtn: {
    width: 32,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreIcon: {
    fontSize: 22,
    color: PawColors.black,
    fontWeight: '700',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotOn: { backgroundColor: '#3d9e4f' },
  dotOff: { backgroundColor: PawColors.textMuted },
});
