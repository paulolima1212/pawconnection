import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfileDualPicture } from '@/components/paw/profile-dual-picture';
import type { ConversationResponse } from '@/lib/api/chat';
import { resolveMediaDisplayUrl } from '@/lib/api/media';
import { openChat } from '@/lib/navigation/open-chat';
import { PawColors, PawFontSize } from '@/constants/paw-styles';

const FALLBACK_DOG = require('@/assets/inbox/dog-avatar.png');
const FALLBACK_HUMAN = require('@/assets/inbox/human-avatar.png');

type InboxConversationItemProps = {
  conversation: ConversationResponse;
  showDivider?: boolean;
  onOpen?: () => void;
};

function formatWhen(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function InboxConversationItem({
  conversation,
  showDivider = true,
  onOpen,
}: InboxConversationItemProps) {
  const router = useRouter();
  const other = conversation.otherUser;
  const preview = conversation.lastMessage?.content?.trim() || 'No messages yet';
  const when = formatWhen(conversation.lastMessageAt ?? conversation.lastMessage?.createdAt ?? null);
  const dogName = other.petName ?? other.fullName;
  const unread = conversation.unreadCount > 0;

  const dogAvatar = useMemo<ImageSourcePropType>(() => {
    const uri = resolveMediaDisplayUrl(other.petPhotoUrl);
    return uri ? { uri } : FALLBACK_DOG;
  }, [other.petPhotoUrl]);

  const humanAvatar = useMemo<ImageSourcePropType>(() => {
    const uri = resolveMediaDisplayUrl(other.photoUrl);
    return uri ? { uri } : FALLBACK_HUMAN;
  }, [other.photoUrl]);

  return (
    <Pressable
      onPress={() => {
        onOpen?.();
        openChat(router, conversation.id, 'inbox');
      }}
      style={({ pressed }) => [styles.block, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Open chat with ${dogName}`}>
      <View style={styles.row}>
        <ProfileDualPicture dogAvatar={dogAvatar} humanAvatar={humanAvatar} />
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.dogName} numberOfLines={1}>
              {dogName}
            </Text>
            {when ? <Text style={styles.time}>{when}</Text> : null}
          </View>
          <Text style={styles.ownerName} numberOfLines={1}>
            {other.fullName}
          </Text>
          <Text style={[styles.preview, unread && styles.previewUnread]} numberOfLines={1}>
            {preview}
          </Text>
        </View>
        {unread ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
            </Text>
          </View>
        ) : null}
      </View>
      {showDivider ? <View style={styles.divider} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.85,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dogName: {
    flex: 1,
    fontSize: PawFontSize.body,
    fontWeight: '600',
    color: PawColors.black,
  },
  ownerName: {
    fontSize: PawFontSize.caption,
    fontWeight: '300',
    color: PawColors.textMuted,
  },
  preview: {
    fontSize: PawFontSize.small,
    fontWeight: '300',
    color: PawColors.textMuted,
    marginTop: 2,
  },
  previewUnread: {
    fontWeight: '600',
    color: PawColors.black,
  },
  time: {
    fontSize: PawFontSize.caption,
    color: PawColors.textMuted,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: PawColors.peachBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: PawColors.black,
  },
  divider: {
    height: 1,
    backgroundColor: PawColors.profileHeaderBorder,
    marginTop: 12,
  },
});
