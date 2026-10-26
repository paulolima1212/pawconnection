import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';

export type PostSafetyAction = 'report' | 'block';
export type OwnerPostAction = 'edit' | 'delete';

type PostActionSheetBase = {
  visible: boolean;
  authorName: string;
  onClose: () => void;
};

type SafetyPostActionSheetProps = PostActionSheetBase & {
  mode?: 'safety';
  onSelect: (action: PostSafetyAction) => void;
};

type OwnerPostActionSheetProps = PostActionSheetBase & {
  mode: 'owner';
  preview?: string;
  confirmDelete?: boolean;
  deleting?: boolean;
  onSelect: (action: OwnerPostAction) => void;
  onConfirmDelete: () => void;
};

type PostActionSheetProps = SafetyPostActionSheetProps | OwnerPostActionSheetProps;

type ActionRowProps = {
  icon: ComponentProps<typeof Feather>['name'];
  label: string;
  hint: string;
  destructive?: boolean;
  onPress: () => void;
};

function ActionRow({ icon, label, hint, destructive, onPress }: ActionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        pressed && (destructive ? styles.actionRowPressedDestructive : styles.actionRowPressed),
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}>
      <View style={[styles.actionIconWrap, destructive && styles.actionIconWrapDestructive]}>
        <Feather
          name={icon}
          size={20}
          color={destructive ? PawColors.destructive : PawColors.black}
        />
      </View>
      <View style={styles.actionTextWrap}>
        <Text style={[styles.actionLabel, destructive && styles.actionLabelDestructive]}>
          {label}
        </Text>
        <Text style={styles.actionHint}>{hint}</Text>
      </View>
      <Feather name="chevron-right" size={20} color={PawColors.chipGray} />
    </Pressable>
  );
}

export function PostActionSheet(props: PostActionSheetProps) {
  const { visible, authorName, onClose } = props;
  const insets = useSafeAreaInsets();
  const owner = props.mode === 'owner';

  const pickSafety = (action: PostSafetyAction) => {
    if (props.mode === 'owner') return;
    // Parent hides this menu via `visible` when Report/Block opens.
    // Closing first used to unmount the target post and skip the next sheet.
    props.onSelect(action);
  };

  const preview = owner
    ? (props.preview ?? '').length > 120
      ? `${(props.preview ?? '').slice(0, 117)}…`
      : props.preview || 'No text'
    : '';

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
          {owner && props.confirmDelete ? (
            <>
              <View style={styles.confirmIconWrap}>
                <Feather name="trash-2" size={22} color={PawColors.destructive} />
              </View>
              <Text style={styles.title}>Delete this post?</Text>
              <Text style={styles.subtitle}>
                Likes and comments go away with it. This cannot be undone.
              </Text>
              <Pressable
                onPress={props.onConfirmDelete}
                disabled={props.deleting}
                style={({ pressed }) => [
                  styles.deleteBtn,
                  pressed && !props.deleting && styles.deleteBtnPressed,
                  props.deleting && styles.deleteBtnDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Confirm delete post">
                {props.deleting ? (
                  <ActivityIndicator color={PawColors.fieldWhite} />
                ) : (
                  <Text style={styles.deleteBtnText}>Delete post</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>{owner ? 'Your post' : 'Post options'}</Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {owner ? preview : authorName}
              </Text>
              <View style={styles.actionsCard}>
                {owner ? (
                  <>
                    <ActionRow
                      icon="edit-2"
                      label="Edit post"
                      hint="Change the text, photos, or who can see it"
                      onPress={() => props.onSelect('edit')}
                    />
                    <View style={styles.divider} />
                    <ActionRow
                      icon="trash-2"
                      label="Delete post"
                      hint="Remove it from the feed"
                      destructive
                      onPress={() => props.onSelect('delete')}
                    />
                  </>
                ) : (
                  <>
                    <ActionRow
                      icon="flag"
                      label="Report post"
                      hint="Tell us why this publication is a problem"
                      onPress={() => pickSafety('report')}
                    />
                    <View style={styles.divider} />
                    <ActionRow
                      icon="slash"
                      label={`Block ${authorName}`}
                      hint="Hide their profile, posts, and messages"
                      destructive
                      onPress={() => pickSafety('block')}
                    />
                  </>
                )}
              </View>
            </>
          )}
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
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(51, 32, 21, 0.45)' },
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
  title: {
    fontSize: PawFontSize.subtitle,
    fontWeight: '700',
    color: PawColors.profileBrown,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 16,
    fontSize: PawFontSize.body,
    fontWeight: '400',
    color: PawColors.textMuted,
    textAlign: 'center',
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
  actionRowPressed: { backgroundColor: PawColors.profileTipBg },
  actionRowPressedDestructive: { backgroundColor: PawColors.destructiveMuted },
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
  actionIconWrapDestructive: {
    backgroundColor: PawColors.destructiveMuted,
    borderColor: PawColors.destructive,
  },
  actionTextWrap: { flex: 1, gap: 2 },
  actionLabel: {
    fontSize: PawFontSize.body,
    fontWeight: '600',
    color: PawColors.black,
  },
  actionLabelDestructive: { color: PawColors.destructive },
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
  cancelBtnPressed: { opacity: 0.88 },
  cancelText: {
    fontSize: PawFontSize.body,
    fontWeight: '600',
    color: PawColors.black,
  },
  confirmIconWrap: {
    alignSelf: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PawColors.destructive,
    backgroundColor: PawColors.destructiveMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  deleteBtn: {
    minHeight: 50,
    borderRadius: PawLayout.borderRadiusField,
    backgroundColor: PawColors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnPressed: { opacity: 0.88 },
  deleteBtnDisabled: { opacity: 0.6 },
  deleteBtnText: {
    fontSize: PawFontSize.body,
    fontWeight: '600',
    color: PawColors.fieldWhite,
  },
});
