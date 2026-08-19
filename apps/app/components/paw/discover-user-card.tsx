import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { DiscoverPerson } from '@/constants/discover';
import { PawColors, PawFontSize, PawLayout } from '@/constants/paw-styles';

const PAW_PRINT = require('@/assets/match-feed/avatar.png');

type DiscoverUserCardProps = {
  person: DiscoverPerson;
  pending?: boolean;
  connecting?: boolean;
  onPress?: () => void;
  onConnectPress?: () => void;
  onExcludePress?: () => void;
};

export function DiscoverUserCard({
  person,
  pending = false,
  connecting = false,
  onPress,
  onConnectPress,
  onExcludePress,
}: DiscoverUserCardProps) {
  const ageLabel = person.age != null ? `, ${person.age}` : '';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.card, pressed && onPress && styles.cardPressed]}>
      <View style={styles.topRow}>
        <View style={styles.profileGroup}>
          {person.avatarUri ? (
            <Image source={{ uri: person.avatarUri }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]} />
          )}
          <View style={styles.nameGroup}>
            <Text style={styles.nameLine}>
              {person.ownerName}
              {ageLabel}
            </Text>
            <View style={styles.petRow}>
              <Image source={PAW_PRINT} style={styles.pawIcon} contentFit="contain" />
              <Text style={styles.petLine} numberOfLines={1}>
                {person.petName} ({person.petBreed})
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable
            onPress={onConnectPress}
            disabled={pending || connecting || !onConnectPress}
            style={[
              styles.actionBtn,
              styles.connectBtn,
              (pending || connecting) && styles.actionBtnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              pending
                ? `Request sent to ${person.ownerName}`
                : `Connect with ${person.ownerName}`
            }>
            {connecting ? (
              <ActivityIndicator size="small" color={PawColors.black} />
            ) : pending ? (
              <Feather name="check" size={20} color={PawColors.black} />
            ) : (
              <Feather name="user-plus" size={20} color={PawColors.black} />
            )}
          </Pressable>
          <Pressable
            onPress={onExcludePress}
            disabled={!onExcludePress}
            style={[styles.actionBtn, styles.excludeBtn]}
            accessibilityRole="button"
            accessibilityLabel={`Hide ${person.ownerName} from discover`}>
            <Feather name="x" size={20} color={PawColors.black} />
          </Pressable>
        </View>
      </View>
      {pending ? (
        <Text style={styles.pendingLabel}>Request sent</Text>
      ) : null}
      <Text style={styles.bio} numberOfLines={3}>
        {person.bio}
      </Text>
      <View style={styles.tagsRow}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{person.breedTag}</Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{person.petGender}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PawColors.whiteCard,
    borderWidth: 1,
    borderColor: PawColors.black,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: PawColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.92,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarFallback: {
    backgroundColor: PawColors.fieldGray,
  },
  nameGroup: {
    flex: 1,
    gap: 2,
  },
  nameLine: {
    fontSize: 18,
    fontWeight: '700',
    color: PawColors.profileBrown,
  },
  petRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pawIcon: {
    width: 14,
    height: 14,
  },
  petLine: {
    fontSize: PawFontSize.small,
    fontWeight: '500',
    color: PawColors.chipGray,
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: PawColors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectBtn: {
    backgroundColor: PawColors.peachBorder,
  },
  excludeBtn: {
    backgroundColor: PawColors.fieldWhite,
  },
  actionBtnDisabled: {
    opacity: 0.65,
  },
  pendingLabel: {
    fontSize: PawFontSize.caption,
    fontWeight: '600',
    color: PawColors.textMuted,
    marginTop: -4,
  },
  bio: {
    fontSize: PawFontSize.small,
    fontWeight: '300',
    color: PawColors.textMuted,
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: PawColors.fieldWhite,
    borderWidth: 0.7,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusPill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagText: {
    fontSize: PawFontSize.caption,
    fontWeight: '300',
    color: PawColors.black,
  },
});
