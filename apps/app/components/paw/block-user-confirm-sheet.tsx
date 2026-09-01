import Feather from '@expo/vector-icons/Feather';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';

type BlockUserConfirmSheetProps = {
  visible: boolean;
  displayName: string;
  blocking?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function BlockUserConfirmSheet({
  visible,
  displayName,
  blocking = false,
  onClose,
  onConfirm,
}: BlockUserConfirmSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={[StyleSheet.absoluteFillObject, styles.backdrop]}
          onPress={blocking ? undefined : onClose}
          accessibilityLabel="Close"
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(20, insets.bottom + 12) }]}>
          <View style={styles.handle} accessibilityElementsHidden />
          <View style={styles.iconWrap}>
            <Feather name="slash" size={22} color={PawColors.destructive} />
          </View>
          <Text style={styles.title}>Block {displayName}?</Text>
          <Text style={styles.subtitle}>
            They will not see your profile, posts, or messages, and you will not see theirs. You can
            unblock them later.
          </Text>
          <Pressable
            onPress={onConfirm}
            disabled={blocking}
            style={({ pressed }) => [
              styles.blockBtn,
              pressed && !blocking && styles.pressed,
              blocking && styles.disabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Block ${displayName}`}
            accessibilityState={{ disabled: blocking, busy: blocking }}>
            {blocking ? (
              <ActivityIndicator color={PawColors.fieldWhite} />
            ) : (
              <Text style={styles.blockText}>Block</Text>
            )}
          </Pressable>
          <Pressable
            onPress={onClose}
            disabled={blocking}
            style={({ pressed }) => [styles.cancelBtn, pressed && !blocking && styles.pressed]}
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
  iconWrap: {
    alignSelf: 'center',
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
  title: {
    fontSize: PawFontSize.title,
    fontWeight: '700',
    color: PawColors.black,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 18,
    fontSize: PawFontSize.body,
    fontWeight: '400',
    color: PawColors.textMuted,
    textAlign: 'center',
    lineHeight: PawLineHeight.body,
  },
  blockBtn: {
    minHeight: 50,
    borderRadius: PawLayout.borderRadiusField,
    borderWidth: 2,
    borderColor: PawColors.destructive,
    backgroundColor: PawColors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockText: {
    fontSize: PawFontSize.body,
    fontWeight: '700',
    color: PawColors.fieldWhite,
  },
  cancelBtn: {
    marginTop: 10,
    minHeight: 50,
    borderRadius: PawLayout.borderRadiusField,
    borderWidth: 1,
    borderColor: PawColors.black,
    backgroundColor: PawColors.fieldWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: PawFontSize.body,
    fontWeight: '600',
    color: PawColors.black,
  },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.7 },
});
