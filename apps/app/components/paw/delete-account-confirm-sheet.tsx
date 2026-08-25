import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';

type DeleteAccountConfirmSheetProps = {
  visible: boolean;
  deleting?: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
};

export function DeleteAccountConfirmSheet({
  visible,
  deleting = false,
  onClose,
  onConfirmDelete,
}: DeleteAccountConfirmSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={[StyleSheet.absoluteFillObject, styles.backdrop]}
          onPress={deleting ? undefined : onClose}
          accessibilityLabel="Close"
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(20, insets.bottom + 12) }]}>
          <View style={styles.handle} accessibilityElementsHidden />
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="alert-circle-outline" size={36} color={PawColors.destructive} />
          </View>
          <Text style={styles.title}>Delete your account?</Text>
          <Text style={styles.subtitle}>
            This permanently deletes your profile, pet details, photos, posts, chats, and location
            data. This cannot be undone.
          </Text>
          <Pressable
            onPress={onClose}
            disabled={deleting}
            style={({ pressed }) => [
              styles.cancelBtn,
              pressed && !deleting && styles.pressed,
              deleting && styles.disabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Keep account">
            <Text style={styles.cancelText}>Keep account</Text>
          </Pressable>
          <Pressable
            onPress={onConfirmDelete}
            disabled={deleting}
            style={({ pressed }) => [
              styles.deleteBtn,
              pressed && !deleting && styles.pressed,
              deleting && styles.disabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Delete account permanently"
            accessibilityState={{ disabled: deleting, busy: deleting }}>
            {deleting ? (
              <ActivityIndicator color={PawColors.destructive} />
            ) : (
              <>
                <MaterialCommunityIcons name="delete-outline" size={18} color={PawColors.destructive} />
                <Text style={styles.deleteText}>Delete permanently</Text>
              </>
            )}
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
    backgroundColor: PawColors.fieldWhite,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    gap: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: PawColors.profileHeaderBorder,
    marginBottom: 8,
  },
  iconWrap: {
    alignItems: 'center',
    paddingTop: 4,
  },
  title: {
    fontSize: PawFontSize.title,
    lineHeight: PawLineHeight.title,
    fontWeight: '800',
    color: PawColors.black,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: PawFontSize.body,
    lineHeight: PawLineHeight.body,
    fontWeight: '400',
    color: PawColors.textMuted,
    textAlign: 'center',
  },
  cancelBtn: {
    minHeight: 48,
    borderRadius: PawLayout.borderRadiusField,
    borderWidth: 2,
    borderColor: PawColors.black,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PawColors.fieldWhite,
  },
  deleteBtn: {
    minHeight: 48,
    borderRadius: PawLayout.borderRadiusField,
    borderWidth: 2,
    borderColor: PawColors.destructive,
    backgroundColor: PawColors.destructiveMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelText: {
    fontSize: PawFontSize.body,
    fontWeight: '700',
    color: PawColors.black,
  },
  deleteText: {
    fontSize: PawFontSize.body,
    fontWeight: '700',
    color: PawColors.destructive,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
});
