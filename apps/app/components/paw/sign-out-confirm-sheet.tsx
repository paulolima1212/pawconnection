import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RemoteMediaImage } from '@/components/paw/remote-media-image';
import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';

type SignOutConfirmSheetProps = {
  visible: boolean;
  dogName: string;
  dogPhotoUri?: string | null;
  signingOut?: boolean;
  onClose: () => void;
  onConfirmSignOut: () => void;
};

function SadPupMascot({
  dogName,
  dogPhotoUri,
}: {
  dogName: string;
  dogPhotoUri?: string | null;
}) {
  return (
    <View style={styles.mascotWrap} accessibilityLabel={`Sad ${dogName}`}>
      <View style={styles.mascotHalo} />
      <View style={styles.mascotCircle}>
        {dogPhotoUri ? (
          <RemoteMediaImage uri={dogPhotoUri} style={styles.mascotPhoto} contentFit="cover" />
        ) : (
          <MaterialCommunityIcons name="dog" size={52} color={PawColors.profileBrown} />
        )}
        <View style={styles.browLeft} />
        <View style={styles.browRight} />
        <View style={styles.tearLeft} />
        <View style={styles.tearRight} />
        <View style={styles.cheekLeft} />
        <View style={styles.cheekRight} />
      </View>
      <View style={styles.pawBadge}>
        <Text style={styles.pawBadgeEmoji}>🐾</Text>
      </View>
    </View>
  );
}

export function SignOutConfirmSheet({
  visible,
  dogName,
  dogPhotoUri,
  signingOut = false,
  onClose,
  onConfirmSignOut,
}: SignOutConfirmSheetProps) {
  const insets = useSafeAreaInsets();
  const name = dogName.trim() || 'your pup';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={[StyleSheet.absoluteFillObject, styles.backdrop]}
          onPress={signingOut ? undefined : onClose}
          accessibilityLabel="Close"
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(20, insets.bottom + 12) }]}>
          <View style={styles.handle} accessibilityElementsHidden />

          <SadPupMascot dogName={name} dogPhotoUri={dogPhotoUri} />

          <Text style={styles.title}>Leaving so soon?</Text>
          <Text style={styles.subtitle}>
            <Text style={styles.subtitleBold}>{name}</Text> will miss you… You can sign back in
            anytime or use another account.
          </Text>

          <View style={styles.heartCard}>
            <MaterialCommunityIcons name="heart-outline" size={18} color={PawColors.profileBrown} />
            <Text style={styles.heartText}>We&apos;ll keep your profile safe until you return.</Text>
          </View>

          <Pressable
            onPress={onClose}
            disabled={signingOut}
            style={({ pressed }) => [
              styles.stayBtn,
              pressed && !signingOut && styles.stayBtnPressed,
              signingOut && styles.btnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Stay signed in with ${name}`}>
            <MaterialCommunityIcons name="home-heart" size={20} color={PawColors.black} />
            <Text style={styles.stayBtnText}>Stay with {name}</Text>
          </Pressable>

          <Pressable
            onPress={onConfirmSignOut}
            disabled={signingOut}
            style={({ pressed }) => [
              styles.signOutBtn,
              pressed && !signingOut && styles.signOutBtnPressed,
              signingOut && styles.btnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sign out">
            {signingOut ? (
              <ActivityIndicator color={PawColors.destructive} />
            ) : (
              <>
                <MaterialCommunityIcons name="logout" size={18} color={PawColors.destructive} />
                <Text style={styles.signOutBtnText}>Sign out anyway</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const MASCOT_SIZE = 108;

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
    marginBottom: 12,
  },
  mascotWrap: {
    alignSelf: 'center',
    marginBottom: 14,
    width: MASCOT_SIZE + 24,
    height: MASCOT_SIZE + 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotHalo: {
    position: 'absolute',
    width: MASCOT_SIZE + 20,
    height: MASCOT_SIZE + 20,
    borderRadius: (MASCOT_SIZE + 20) / 2,
    backgroundColor: PawColors.reactionLavender,
    opacity: 0.55,
  },
  mascotCircle: {
    width: MASCOT_SIZE,
    height: MASCOT_SIZE,
    borderRadius: MASCOT_SIZE / 2,
    borderWidth: 3,
    borderColor: PawColors.black,
    backgroundColor: PawColors.peachBorder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mascotPhoto: {
    width: '100%',
    height: '100%',
  },
  browLeft: {
    position: 'absolute',
    top: 30,
    left: 26,
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: PawColors.profileBrown,
    transform: [{ rotate: '18deg' }],
  },
  browRight: {
    position: 'absolute',
    top: 30,
    right: 26,
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: PawColors.profileBrown,
    transform: [{ rotate: '-18deg' }],
  },
  tearLeft: {
    position: 'absolute',
    top: 42,
    left: 32,
    width: 8,
    height: 12,
    borderRadius: 4,
    backgroundColor: '#8EC5FF',
    borderWidth: 1,
    borderColor: PawColors.black,
  },
  tearRight: {
    position: 'absolute',
    top: 44,
    right: 30,
    width: 7,
    height: 10,
    borderRadius: 4,
    backgroundColor: '#8EC5FF',
    borderWidth: 1,
    borderColor: PawColors.black,
  },
  cheekLeft: {
    position: 'absolute',
    bottom: 28,
    left: 18,
    width: 14,
    height: 9,
    borderRadius: 7,
    backgroundColor: 'rgba(244, 106, 116, 0.35)',
  },
  cheekRight: {
    position: 'absolute',
    bottom: 28,
    right: 18,
    width: 14,
    height: 9,
    borderRadius: 7,
    backgroundColor: 'rgba(244, 106, 116, 0.35)',
  },
  pawBadge: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: PawColors.black,
    backgroundColor: PawColors.whiteCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pawBadgeEmoji: {
    fontSize: 16,
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
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  subtitleBold: {
    fontWeight: '700',
    color: PawColors.profileBrown,
  },
  heartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: PawColors.profileTipBg,
    borderWidth: 1,
    borderColor: PawColors.reactionLavender,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  heartText: {
    flex: 1,
    fontSize: PawFontSize.small,
    fontWeight: '400',
    color: 'rgba(51,32,21,0.75)',
    lineHeight: PawLineHeight.small,
  },
  stayBtn: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  stayBtnPressed: {
    opacity: 0.9,
  },
  stayBtnText: {
    fontSize: PawFontSize.subtitle,
    fontWeight: '800',
    color: PawColors.black,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    borderRadius: PawLayout.borderRadiusField,
    borderWidth: 2,
    borderColor: PawColors.destructive,
    backgroundColor: PawColors.destructiveMuted,
  },
  signOutBtnPressed: {
    opacity: 0.88,
  },
  signOutBtnText: {
    fontSize: PawFontSize.body,
    fontWeight: '700',
    color: PawColors.destructive,
  },
  btnDisabled: {
    opacity: 0.65,
  },
});
