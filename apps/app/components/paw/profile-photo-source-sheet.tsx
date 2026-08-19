import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';

type ProfilePhotoSourceSheetProps = {
  visible: boolean;
  disabled?: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onChooseLibrary: () => void;
};

export function ProfilePhotoSourceSheet({
  visible,
  disabled = false,
  onClose,
  onTakePhoto,
  onChooseLibrary,
}: ProfilePhotoSourceSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={[StyleSheet.absoluteFillObject, styles.backdrop]}
          onPress={disabled ? undefined : onClose}
          accessibilityLabel="Close profile photo options"
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(20, insets.bottom + 12) }]}>
          <View style={styles.handle} accessibilityElementsHidden />

          <View style={styles.iconBadge}>
            <MaterialCommunityIcons name="camera-outline" size={28} color={PawColors.profileBrown} />
          </View>

          <Text style={styles.title}>Profile photo</Text>
          <Text style={styles.subtitle}>
            Take a new photo or choose one from your library.
          </Text>

          <Pressable
            onPress={onTakePhoto}
            disabled={disabled}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && !disabled && styles.primaryBtnPressed,
              disabled && styles.btnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Take photo">
            <Feather name="camera" size={18} color={PawColors.black} />
            <Text style={styles.primaryBtnText}>Take photo</Text>
          </Pressable>

          <Pressable
            onPress={onChooseLibrary}
            disabled={disabled}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && !disabled && styles.secondaryBtnPressed,
              disabled && styles.btnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Choose from library">
            <Feather name="image" size={18} color={PawColors.profileBrown} />
            <Text style={styles.secondaryBtnText}>Choose from library</Text>
          </Pressable>

          <Pressable
            onPress={onClose}
            disabled={disabled}
            style={({ pressed }) => [
              styles.cancelBtn,
              pressed && !disabled && styles.cancelBtnPressed,
              disabled && styles.btnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Cancel">
            <Text style={styles.cancelBtnText}>Cancel</Text>
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
    marginBottom: 14,
  },
  iconBadge: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: PawColors.black,
    backgroundColor: PawColors.reactionLavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: PawFontSize.title,
    fontWeight: '800',
    color: PawColors.black,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: PawFontSize.body,
    fontWeight: '300',
    color: PawColors.textMuted,
    textAlign: 'center',
    lineHeight: PawLineHeight.body,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: PawColors.black,
    backgroundColor: PawColors.peach,
    marginBottom: 10,
  },
  primaryBtnPressed: {
    opacity: 0.9,
  },
  primaryBtnText: {
    fontSize: PawFontSize.subtitle,
    fontWeight: '800',
    color: PawColors.black,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 50,
    borderRadius: PawLayout.borderRadiusWhiteField,
    borderWidth: 2,
    borderColor: PawColors.black,
    backgroundColor: PawColors.whiteCard,
    marginBottom: 10,
  },
  secondaryBtnPressed: {
    opacity: 0.9,
  },
  secondaryBtnText: {
    fontSize: PawFontSize.body,
    fontWeight: '700',
    color: PawColors.profileBrown,
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: 8,
  },
  cancelBtnPressed: {
    opacity: 0.7,
  },
  cancelBtnText: {
    fontSize: PawFontSize.body,
    fontWeight: '600',
    color: PawColors.textMuted,
  },
  btnDisabled: {
    opacity: 0.55,
  },
});
