import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FIGMA_SETUP_YOU } from '@/constants/paw-figma-assets';
import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';
import { publicHandleFromDraft, useProfileOnboarding } from '@/context/profile-onboarding';
import { getAppBaseUrl } from '@/lib/api/config';

const EASY_QR_IMAGE = require('@/assets/onboarding/easy-qr.png');

export default function EasyQrScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft, completeOnboarding, handle } = useProfileOnboarding();

  const displayHandle = handle ?? publicHandleFromDraft(draft);
  const normalizedHandle = displayHandle.startsWith('@')
    ? displayHandle
    : `@${displayHandle}`;
  const profileUrl = `${getAppBaseUrl()}${normalizedHandle}`;

  const goHome = async () => {
    await completeOnboarding();
    router.replace('/social-feed');
  };

  const onBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/setup-you');
  };

  const onSaveQr = async () => {
    try {
      await Share.share({
        message: `EasyQR — ${displayHandle}\n${profileUrl}`,
        title: 'Paw Connection',
      });
    } catch {
      /* user dismissed share sheet */
    }
    await goHome();
  };

  const onShareUrl = async () => {
    try {
      await Share.share({
        message: profileUrl,
        url: profileUrl,
        title: 'My Paw Connection profile',
      });
    } catch {
      /* user dismissed share sheet */
    }
    await goHome();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Image source={FIGMA_SETUP_YOU.back} style={styles.back} contentFit="contain" />
        </Pressable>
        <Text style={styles.headerTitle}>EasyQR</Text>
        <View style={styles.backSpacer} />
      </View>
      <View style={styles.content}>
        <View style={styles.qrCard}>
          <Image source={EASY_QR_IMAGE} style={styles.qr} contentFit="contain" />
        </View>
        <Text style={styles.sectionTitle}>About you</Text>
        <Text style={styles.handle}>{displayHandle}</Text>
        <Pressable onPress={onSaveQr} style={styles.btn}>
          <Text style={styles.btnText}>Save EasyQR code</Text>
        </Pressable>
        <Pressable onPress={onShareUrl} style={styles.btn}>
          <Text style={styles.btnText}>Share URL</Text>
        </Pressable>
        <Pressable onPress={goHome}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PawColors.creamBg,
    maxWidth: PawLayout.screenMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PawLayout.horizontalPadding,
    marginTop: 8,
  },
  back: {
    width: 32,
    height: 32,
    transform: [{ rotate: '-90deg' }],
  },
  backSpacer: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    fontSize: PawFontSize.profileName,
    fontWeight: '800',
    color: PawColors.black,
    letterSpacing: 0.26,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 16,
  },
  qrCard: {
    width: 242,
    height: 242,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  qr: {
    width: 220,
    height: 220,
  },
  sectionTitle: {
    marginTop: 40,
    fontSize: PawFontSize.title,
    fontWeight: '800',
    color: PawColors.black,
    letterSpacing: 0.22,
  },
  handle: {
    fontSize: PawFontSize.subtitle,
    fontWeight: '300',
    color: PawColors.black,
    letterSpacing: 0.36,
    lineHeight: PawLineHeight.subtitle,
  },
  btn: {
    alignSelf: 'stretch',
    backgroundColor: PawColors.peachBorder,
    borderWidth: 3,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusField,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnText: {
    fontSize: PawFontSize.body,
    fontWeight: '800',
    color: PawColors.black,
  },
  cancel: {
    marginTop: 24,
    fontSize: PawFontSize.subtitle,
    fontWeight: '300',
    color: PawColors.black,
    letterSpacing: 0.36,
    lineHeight: PawLineHeight.subtitle,
  },
});
