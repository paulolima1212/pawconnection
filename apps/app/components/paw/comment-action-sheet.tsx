import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';

export type CommentAction = 'edit' | 'delete';

type CommentActionSheetProps = {
  visible: boolean;
  authorName: string;
  commentPreview: string;
  /** When true, shows the delete confirmation step instead of the action list. */
  confirmDelete?: boolean;
  deleting?: boolean;
  onClose: () => void;
  onSelect: (action: CommentAction) => void;
  onConfirmDelete: () => void;
};

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
      <View
        style={[
          styles.actionIconWrap,
          destructive && styles.actionIconWrapDestructive,
        ]}>
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

export function CommentActionSheet({
  visible,
  authorName,
  commentPreview,
  confirmDelete = false,
  deleting = false,
  onClose,
  onSelect,
  onConfirmDelete,
}: CommentActionSheetProps) {
  const insets = useSafeAreaInsets();

  const pick = (action: CommentAction) => {
    if (action === 'delete') {
      onSelect('delete');
      return;
    }
    onClose();
    requestAnimationFrame(() => onSelect(action));
  };

  const preview =
    commentPreview.length > 120 ? `${commentPreview.slice(0, 117)}…` : commentPreview;

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

          {confirmDelete ? (
            <>
              <View style={styles.confirmHeader}>
                <View style={styles.confirmIconWrap}>
                  <Feather name="trash-2" size={22} color={PawColors.destructive} />
                </View>
                <Text style={styles.confirmTitle}>Delete comment?</Text>
                <Text style={styles.confirmSubtitle}>
                  Replies will stay visible. This action cannot be undone.
                </Text>
              </View>

              <View style={styles.previewCard}>
                <Text style={styles.previewAuthor} numberOfLines={1}>
                  {authorName}
                </Text>
                <Text style={styles.previewText}>{preview}</Text>
              </View>

              <Pressable
                onPress={onConfirmDelete}
                disabled={deleting}
                style={({ pressed }) => [
                  styles.deleteBtn,
                  pressed && !deleting && styles.deleteBtnPressed,
                  deleting && styles.deleteBtnDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Confirm delete">
                {deleting ? (
                  <ActivityIndicator color={PawColors.fieldWhite} />
                ) : (
                  <Text style={styles.deleteBtnText}>Delete comment</Text>
                )}
              </Pressable>

              <Pressable
                onPress={onClose}
                disabled={deleting}
                style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelBtnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Cancel">
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.identity}>
                <View style={styles.identityIconWrap}>
                  <Feather name="message-circle" size={22} color={PawColors.profileBrown} />
                </View>
                <View style={styles.identityText}>
                  <Text style={styles.identityTitle} numberOfLines={1}>
                    Your comment
                  </Text>
                  <Text style={styles.identityPreview} numberOfLines={2}>
                    {preview}
                  </Text>
                </View>
              </View>

              <View style={styles.actionsCard}>
                <ActionRow
                  icon="edit-2"
                  label="Edit comment"
                  hint="Change what you wrote"
                  onPress={() => pick('edit')}
                />
                <View style={styles.divider} />
                <ActionRow
                  icon="trash-2"
                  label="Delete comment"
                  hint="Replies will stay visible"
                  destructive
                  onPress={() => pick('delete')}
                />
              </View>

              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelBtnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Cancel">
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </>
          )}
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
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  identityIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: PawColors.black,
    backgroundColor: PawColors.peachBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: {
    flex: 1,
    gap: 4,
    paddingTop: 2,
  },
  identityTitle: {
    fontSize: PawFontSize.subtitle,
    fontWeight: '700',
    color: PawColors.profileBrown,
    lineHeight: PawLineHeight.subtitle,
  },
  identityPreview: {
    fontSize: PawFontSize.body,
    fontWeight: '400',
    color: PawColors.textMuted,
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
  actionRowPressedDestructive: {
    backgroundColor: PawColors.destructiveMuted,
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
  actionIconWrapDestructive: {
    backgroundColor: PawColors.destructiveMuted,
    borderColor: PawColors.destructive,
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
  actionLabelDestructive: {
    color: PawColors.destructive,
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
  confirmHeader: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  confirmIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: PawColors.destructive,
    backgroundColor: PawColors.destructiveMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: PawFontSize.title,
    fontWeight: '700',
    color: PawColors.black,
    textAlign: 'center',
  },
  confirmSubtitle: {
    marginTop: 8,
    fontSize: PawFontSize.body,
    fontWeight: '400',
    color: PawColors.textMuted,
    textAlign: 'center',
    lineHeight: PawLineHeight.body,
  },
  previewCard: {
    backgroundColor: PawColors.whiteCard,
    borderRadius: PawLayout.borderRadiusCard,
    borderWidth: 1,
    borderColor: PawColors.black,
    padding: 14,
    marginBottom: 16,
  },
  previewAuthor: {
    fontSize: PawFontSize.small,
    fontWeight: '600',
    color: PawColors.profileBrown,
    marginBottom: 6,
  },
  previewText: {
    fontSize: PawFontSize.body,
    color: PawColors.black,
    lineHeight: PawLineHeight.body,
  },
  deleteBtn: {
    minHeight: 50,
    borderRadius: PawLayout.borderRadiusField,
    borderWidth: 2,
    borderColor: PawColors.destructive,
    backgroundColor: PawColors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnPressed: {
    opacity: 0.9,
  },
  deleteBtnDisabled: {
    opacity: 0.7,
  },
  deleteBtnText: {
    fontSize: PawFontSize.body,
    fontWeight: '700',
    color: PawColors.fieldWhite,
  },
});
