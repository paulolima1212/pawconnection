import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RemoteMediaImage } from '@/components/paw/remote-media-image';
import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';

export type ProfileAvatarAction = 'profile' | 'message' | 'photos';

type ProfileAvatarActionSheetProps = {
  visible: boolean;
  dogName: string;
  ownerName: string;
  dogPhotoUri: string;
  humanPhotoUri: string;
  onClose: () => void;
  onSelect: (action: ProfileAvatarAction) => void;
  /** Hidden when viewing your own profile. */
  showMessage?: boolean;
};

type ActionRowProps = {
  icon: ComponentProps<typeof Feather>['name'];
  label: string;
  hint: string;
  accent?: boolean;
  onPress: () => void;
};

function ActionRow({ icon, label, hint, accent, onPress }: ActionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}>
      <View style={[styles.actionIconWrap, accent && styles.actionIconWrapAccent]}>
        <Feather name={icon} size={20} color={accent ? PawColors.profileBrown : PawColors.black} />
      </View>
      <View style={styles.actionTextWrap}>
        <Text style={styles.actionLabel}>{label}</Text>
        <Text style={styles.actionHint}>{hint}</Text>
      </View>
      <Feather name="chevron-right" size={20} color={PawColors.chipGray} />
    </Pressable>
  );
}

export function ProfileAvatarActionSheet({
  visible,
  dogName,
  ownerName,
  dogPhotoUri,
  humanPhotoUri,
  onClose,
  onSelect,
  showMessage = true,
}: ProfileAvatarActionSheetProps) {
  const insets = useSafeAreaInsets();

  const pick = (action: ProfileAvatarAction) => {
    onClose();
    requestAnimationFrame(() => onSelect(action));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={[StyleSheet.absoluteFillObject, styles.backdrop]}
          onPress={onClose}
          accessibilityLabel="Close menu"
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(20, insets.bottom + 12) }]}>
          <View style={styles.handle} accessibilityElementsHidden />

          <View style={styles.identity}>
            <View style={styles.identityAvatars}>
              <RemoteMediaImage uri={dogPhotoUri} style={styles.previewDog} contentFit="cover" />
              <RemoteMediaImage uri={humanPhotoUri} style={styles.previewHuman} contentFit="cover" />
            </View>
            <View style={styles.identityText}>
              <Text style={styles.petName} numberOfLines={1}>
                {dogName}
              </Text>
              <Text style={styles.ownerName} numberOfLines={1}>
                {ownerName}
              </Text>
            </View>
          </View>

          <View style={styles.actionsCard}>
            <ActionRow
              icon="user"
              label="View profile"
              hint="See pet and owner details"
              accent
              onPress={() => pick('profile')}
            />
            {showMessage ? (
              <>
                <View style={styles.divider} />
                <ActionRow
                  icon="message-circle"
                  label="Send message"
                  hint="Start a private chat"
                  onPress={() => pick('message')}
                />
              </>
            ) : null}
            <View style={styles.divider} />
            <ActionRow
              icon="image"
              label="View photos"
              hint="Swipe between pet and owner"
              onPress={() => pick('photos')}
            />
          </View>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Cancel">
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(51, 32, 21, 0.45)',
  },
  sheet: {
    backgroundColor: PawColors.creamBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: PawColors.black,
    paddingHorizontal: PawLayout.horizontalPadding,
    paddingTop: 10,
    maxWidth: PawLayout.screenMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: PawColors.chipGray,
    opacity: 0.5,
    marginBottom: 16,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  identityAvatars: {
    width: 72,
    height: 70,
    position: 'relative',
  },
  previewDog: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: PawColors.black,
    backgroundColor: PawColors.fieldGray,
  },
  previewHuman: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: PawColors.black,
    backgroundColor: PawColors.fieldWhite,
  },
  identityText: {
    flex: 1,
    gap: 2,
  },
  petName: {
    fontSize: PawFontSize.subtitle,
    fontWeight: '700',
    color: PawColors.profileBrown,
    lineHeight: PawLineHeight.subtitle,
  },
  ownerName: {
    fontSize: PawFontSize.body,
    fontWeight: '400',
    color: PawColors.chipGray,
    lineHeight: PawLineHeight.body,
  },
  actionsCard: {
    backgroundColor: PawColors.whiteCard,
    borderRadius: PawLayout.borderRadiusCard + 3,
    borderWidth: 1,
    borderColor: PawColors.black,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  actionRowPressed: {
    backgroundColor: PawColors.profileTipBg,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: PawColors.black,
    backgroundColor: PawColors.fieldWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconWrapAccent: {
    backgroundColor: PawColors.peachBorder,
    borderWidth: 2,
  },
  actionTextWrap: {
    flex: 1,
    gap: 2,
  },
  actionLabel: {
    fontSize: PawFontSize.body,
    fontWeight: '600',
    color: PawColors.black,
  },
  actionHint: {
    fontSize: PawFontSize.caption,
    fontWeight: '300',
    color: PawColors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: PawColors.profileHeaderBorder,
    marginHorizontal: 16,
  },
  cancelBtn: {
    marginTop: 14,
    minHeight: 50,
    borderRadius: PawLayout.borderRadiusField,
    borderWidth: 1,
    borderColor: PawColors.black,
    backgroundColor: PawColors.fieldWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnPressed: {
    opacity: 0.88,
  },
  cancelText: {
    fontSize: PawFontSize.body,
    fontWeight: '600',
    color: PawColors.black,
  },
});
