import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FieldInput } from '@/components/paw/field-input';
import { KeyboardAwareFormScroll } from '@/components/paw/keyboard-aware-form-scroll';
import { GenderSelector } from '@/components/paw/gender-selector';
import { PawLogo } from '@/components/paw/paw-logo';
import { ProfilePhotoSlot } from '@/components/paw/profile-photo-slot';
import { FIGMA_SETUP_YOU } from '@/constants/paw-figma-assets';
import { PawColors, PawFontSize, PawLayout } from '@/constants/paw-styles';
import { tooltipMessageFromError, usePawTooltip } from '@/context/paw-tooltip';
import { useProfileOnboarding } from '@/context/profile-onboarding';
import { ApiError } from '@/lib/api/client';
import { getApiBaseUrl } from '@/lib/api/config';

export default function SetupYouScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft, setDraft, registerAndSyncOwner, syncPetToApi } = useProfileOnboarding();
  const { showTooltip } = usePawTooltip();
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const canComplete =
    draft.fullName.trim().length > 0 &&
    draft.email.trim().length > 0 &&
    password.length >= 6;

  const onBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/setup-dog');
  };

  const onComplete = async () => {
    if (!canComplete || saving) return;
    setSaving(true);
    try {
      await registerAndSyncOwner(password);
      await syncPetToApi();
      router.push('/easy-qr');
    } catch (err) {
      let message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not save your profile.';
      if (__DEV__ && message.includes('Could not reach')) {
        message += `\n\n(API: ${getApiBaseUrl()})`;
      }
      showTooltip({
        title: 'Setup failed',
        message: tooltipMessageFromError(err, message),
        variant: 'error',
        durationMs: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <KeyboardAwareFormScroll
        contentContainerStyle={styles.scroll}
        keyboardVerticalOffset={insets.top}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} hitSlop={12}>
            <Image source={FIGMA_SETUP_YOU.back} style={styles.back} contentFit="contain" />
          </Pressable>
          <PawLogo variant="mark" width={152} height={96} />
          <View style={styles.backSpacer} />
        </View>
        <Text style={styles.headline}>
          Great!{'\n'}Now let&apos;s add your profile.
        </Text>
        <View style={styles.illusWrap}>
          <Image
            source={FIGMA_SETUP_YOU.ownerIllustration}
            style={styles.illus}
            contentFit="cover"
          />
        </View>
        <Text style={styles.sectionTitle}>About you</Text>
        <Text style={styles.profilePicLabel}>
          <Text style={styles.label}>Profile picture </Text>
          <Text style={styles.optional}>(optional)</Text>
        </Text>
        <ProfilePhotoSlot
          imageUri={draft.humanPhotoUri}
          onImageChange={(uri) => setDraft({ humanPhotoUri: uri })}
        />
        <View style={styles.form}>
          <LabeledBlock label="Full name">
            <FieldInput
              placeholder="Enter your full name"
              value={draft.fullName}
              onChangeText={(t) => setDraft({ fullName: t })}
            />
          </LabeledBlock>
          <LabeledBlock label="Email">
            <FieldInput
              placeholder="Enter your email"
              value={draft.email}
              onChangeText={(t) => setDraft({ email: t })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </LabeledBlock>
          <LabeledBlock label="Password">
            <FieldInput
              placeholder="Create a password (min 6 characters)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </LabeledBlock>
          <LabeledBlock label="Age">
            <FieldInput
              placeholder="Age"
              value={draft.age}
              onChangeText={(t) => setDraft({ age: t })}
              keyboardType="number-pad"
            />
          </LabeledBlock>
          <LabeledBlock label="Gender">
            <GenderSelector value={draft.humanGender} onChange={(v) => setDraft({ humanGender: v })} />
          </LabeledBlock>
          <LabeledBlock label="Location">
            <FieldInput
              placeholder="Enter your suburb"
              value={draft.location}
              onChangeText={(t) => setDraft({ location: t })}
            />
          </LabeledBlock>
          <View style={styles.bioBlock}>
            <Text style={styles.label}>About you</Text>
            <Text style={styles.thinHint}>Write up to 200 words</Text>
            <FieldInput
              placeholder="Your short bio"
              multiline
              value={draft.humanBio}
              onChangeText={(t) => setDraft({ humanBio: t })}
              style={styles.bioInput}
            />
          </View>
        </View>
        <Pressable
          onPress={onComplete}
          style={[styles.completeBtn, (!canComplete || saving) && styles.completeBtnDisabled]}
          disabled={!canComplete || saving}>
          <Text style={styles.completeText}>{saving ? 'Saving…' : 'Complete'}</Text>
        </Pressable>
        <View style={{ height: Math.max(24, insets.bottom) }} />
      </KeyboardAwareFormScroll>
    </View>
  );
}

function LabeledBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      {children}
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
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headline: {
    marginTop: 20,
    fontSize: PawFontSize.title,
    fontWeight: '800',
    color: PawColors.black,
    textAlign: 'center',
    letterSpacing: 0.22,
  },
  illusWrap: {
    alignSelf: 'center',
    marginTop: 20,
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: 'hidden',
  },
  illus: {
    width: '100%',
    height: '100%',
  },
  sectionTitle: {
    marginTop: 36,
    fontSize: PawFontSize.title,
    fontWeight: '800',
    color: PawColors.black,
    letterSpacing: 0.22,
  },
  profilePicLabel: {
    marginTop: 8,
    textAlign: 'left',
  },
  label: {
    fontSize: PawFontSize.body,
    fontWeight: '300',
    color: PawColors.black,
    letterSpacing: 0.32,
  },
  optional: {
    fontSize: PawFontSize.body,
    fontWeight: '300',
    color: PawColors.textLabelGray,
  },
  form: {
    marginTop: 24,
    gap: 18,
  },
  fieldBlock: {
    gap: 14,
  },
  bioBlock: {
    gap: 8,
  },
  thinHint: {
    fontSize: PawFontSize.body,
    fontWeight: '100',
    color: PawColors.black,
    marginTop: 4,
  },
  bioInput: {
    minHeight: 56,
  },
  completeBtn: {
    marginTop: 28,
    backgroundColor: PawColors.peachBorder,
    borderWidth: 3,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusField,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeBtnDisabled: {
    opacity: 0.45,
  },
  completeText: {
    fontSize: PawFontSize.body,
    fontWeight: '800',
    color: PawColors.black,
  },
});
