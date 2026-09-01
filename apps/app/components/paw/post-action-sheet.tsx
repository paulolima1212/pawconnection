import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';

export type PostSafetyAction = 'report' | 'block';

type PostActionSheetProps = {
  visible: boolean;
  authorName: string;
  onClose: () => void;
  onSelect: (action: PostSafetyAction) => void;
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

export function PostActionSheet({
  visible,
  authorName,
  onClose,
  onSelect,
}: PostActionSheetProps) {
  const insets = useSafeAreaInsets();

  const pick = (action: PostSafetyAction) => {
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
          <Text style={styles.title}>Post options</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {authorName}
          </Text>
          <View style={styles.actionsCard}>
            <ActionRow
              icon="flag"
              label="Report post"
              hint="Tell us why this publication is a problem"
              onPress={() => pick('report')}
            />
            <View style={styles.divider} />
            <ActionRow
              icon="slash"
              label={`Block ${authorName}`}
              hint="Hide their profile, posts, and messages"
              destructive
              onPress={() => pick('block')}
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
});
