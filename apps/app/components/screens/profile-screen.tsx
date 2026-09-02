import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GenderSelector } from '@/components/paw/gender-selector';
import { BirthdayField } from '@/components/paw/birthday-field';
import { BreedAutocomplete } from '@/components/paw/breed-autocomplete';
import { KeyboardAwareFormScroll } from '@/components/paw/keyboard-aware-form-scroll';
import { OptionDropdown } from '@/components/paw/option-dropdown';
import { ProfileAvatarStack } from '@/components/paw/profile-avatar-stack';
import { ProfileFieldInput } from '@/components/paw/profile-field-input';
import { ProfileInfoSwitch, type ProfileInfoTab } from '@/components/paw/profile-info-switch';
import { ProfileLabeledField } from '@/components/paw/profile-labeled-field';
import { ProfileTipBanner } from '@/components/paw/profile-tip-banner';
import { DeleteAccountConfirmSheet } from '@/components/paw/delete-account-confirm-sheet';
import { SignOutConfirmSheet } from '@/components/paw/sign-out-confirm-sheet';
import { ACCOUNT_DELETION_INFO_URL, PRIVACY_POLICY_URL } from '@/constants/legal';
import { PROFILE_FIGMA } from '@/constants/profile-figma-assets';
import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';
import { useAuth } from '@/context/auth';
import { usePawTooltip } from '@/context/paw-tooltip';
import {
  TEMPERAMENT_OPTIONS,
  type DesexedValue,
  type ProfileDraft,
  type TemperamentValue,
  type VaccinatedValue,
  useProfileOnboarding,
} from '@/context/profile-onboarding';
import { ApiError } from '@/lib/api/client';
import * as profileApi from '@/lib/api/profile';
import { profileMeToDraft } from '@/lib/api/profile-mapper';
import { extractStorageObjectPath, resolveMediaUrl } from '@/lib/api/media';
import { ageFromBirthdayIso } from '@/lib/pet-birthday';
import { isValidHandle, sanitizeHandleInput } from '@/lib/handle';

function photoSnapshotKey(uri: string | null): string | null {
  if (!uri?.trim()) return null;
  const resolved = resolveMediaUrl(uri);
  if (!resolved) return uri.trim();
  return extractStorageObjectPath(resolved) ?? resolved;
}

function draftSnapshot(draft: ProfileDraft): string {
  return JSON.stringify({
    ...draft,
    dogPhotoUri: photoSnapshotKey(draft.dogPhotoUri),
    humanPhotoUri: photoSnapshotKey(draft.humanPhotoUri),
  });
}

const ENJOY_ROWS = [
  { key: 'dogEnjoysPark' as const, label: 'Enjoys the park' },
  { key: 'dogEnjoysWater' as const, label: 'Enjoys water play' },
  { key: 'dogEnjoysWalks' as const, label: 'Enjoys long walks' },
];

const TEMPERAMENT_DROPDOWN_OPTIONS = TEMPERAMENT_OPTIONS.map((v) => ({ value: v, label: v }));

const VACCINATED_OPTIONS: { value: VaccinatedValue; label: string }[] = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
];

const DESEXED_OPTIONS: { value: DesexedValue; label: string }[] = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
];

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();
  const { draft, setDraft, setDraftPhoto, hydrated, syncOwnerToApi, syncPetToApi, syncPhotoToApi, clearLocalProfile } =
    useProfileOnboarding();
  const [photoUploading, setPhotoUploading] = useState(false);
  const [infoTab, setInfoTab] = useState<ProfileInfoTab>('owner');
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [signOutSheetOpen, setSignOutSheetOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const { showTooltip } = usePawTooltip();

  useEffect(() => {
    if (!hydrated || savedSnapshot !== null) return;
    setSavedSnapshot(draftSnapshot(draft));
  }, [hydrated, draft, savedSnapshot]);

  const isDirty = useMemo(() => {
    if (savedSnapshot === null) return false;
    return draftSnapshot(draft) !== savedSnapshot;
  }, [draft, savedSnapshot]);

  const dogName = draft.dogName.trim() || 'Pluto';
  const ownerFirst =
    draft.fullName.trim().split(/\s+/)[0] || draft.fullName.trim() || 'Jefferson';
  const ownerFullName = draft.fullName.trim() || 'Jefferson';

  const onSave = async () => {
    if (infoTab === 'owner' && !isValidHandle(draft.handle)) {
      showTooltip({
        title: 'Handle required',
        message: 'Choose an @ handle with 3–20 letters, numbers, or underscores.',
        variant: 'info',
      });
      return;
    }
    setSaving(true);
    try {
      const profile =
        infoTab === 'owner' ? await syncOwnerToApi() : await syncPetToApi();
      if (profile) {
        setSavedSnapshot(draftSnapshot(profileMeToDraft(profile, draft)));
      } else {
        setSavedSnapshot(draftSnapshot(draft));
      }
      showTooltip({
        title: 'Profile saved',
        message: 'Your changes have been saved.',
        variant: 'success',
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not save profile.';
      showTooltip({
        title: 'Save failed',
        message,
        variant: 'error',
        durationMs: 4200,
      });
    } finally {
      setSaving(false);
    }
  };

  const onBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/social-feed');
  };

  const onConfirmSignOut = async () => {
    setSigningOut(true);
    try {
      await logout();
      setSignOutSheetOpen(false);
      router.replace('/auth');
    } catch {
      showTooltip({
        title: 'Sign out failed',
        message: 'Could not sign out. Please try again.',
        variant: 'error',
      });
    } finally {
      setSigningOut(false);
    }
  };

  const openLegalUrl = async (url: string) => {
    try {
      await openBrowserAsync(url, { presentationStyle: WebBrowserPresentationStyle.AUTOMATIC });
    } catch {
      showTooltip({
        title: 'Could not open page',
        message: 'Please try again or visit the link from a browser.',
        variant: 'error',
      });
    }
  };

  const onConfirmDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await profileApi.deleteMyAccount();
      await clearLocalProfile();
      await logout();
      setDeleteSheetOpen(false);
      router.replace('/auth');
      showTooltip({
        title: 'Account deleted',
        message: 'Your Paw Connection account and data have been removed.',
        variant: 'success',
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not delete account.';
      showTooltip({
        title: 'Delete failed',
        message,
        variant: 'error',
        durationMs: 4200,
      });
    } finally {
      setDeletingAccount(false);
    }
  };

  const onPhotoChange = useCallback(
    async (field: 'dog' | 'human', uri: string) => {
      const draftField = field === 'dog' ? 'dogPhotoUri' : 'humanPhotoUri';
      setDraftPhoto(draftField, uri);
      setPhotoUploading(true);
      try {
        const profile = await syncPhotoToApi(field, uri);
        if (profile) {
          setSavedSnapshot(draftSnapshot(profileMeToDraft(profile, draft)));
        }
        showTooltip({
          title: 'Photo updated',
          message: 'Your profile photo has been saved.',
          variant: 'success',
        });
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Could not upload profile photo.';
        showTooltip({
          title: 'Photo upload failed',
          message,
          variant: 'error',
          durationMs: 4200,
        });
      } finally {
        setPhotoUploading(false);
      }
    },
    [draft, setDraftPhoto, syncPhotoToApi, showTooltip],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <SignOutConfirmSheet
        visible={signOutSheetOpen}
        dogName={dogName}
        dogPhotoUri={draft.dogPhotoUri}
        signingOut={signingOut}
        onClose={() => {
          if (!signingOut) setSignOutSheetOpen(false);
        }}
        onConfirmSignOut={() => void onConfirmSignOut()}
      />
      <DeleteAccountConfirmSheet
        visible={deleteSheetOpen}
        deleting={deletingAccount}
        onClose={() => {
          if (!deletingAccount) setDeleteSheetOpen(false);
        }}
        onConfirmDelete={() => void onConfirmDeleteAccount()}
      />
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          hitSlop={12}
          style={styles.headerIconBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Image source={PROFILE_FIGMA.iconBack} style={styles.backIcon} contentFit="contain" />
        </Pressable>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Profile Settings
        </Text>
        <View style={styles.headerIconBtn} />
      </View>

      <View style={styles.scroll}>
        <KeyboardAwareFormScroll
          contentContainerStyle={styles.scrollContent}
          keyboardVerticalOffset={insets.top + 64}>
        <View style={styles.switchWrap}>
          <ProfileInfoSwitch value={infoTab} onChange={setInfoTab} />
        </View>

        <ProfileAvatarStack
          activeTab={infoTab}
          dogName={dogName}
          ownerName={ownerFirst}
          ownerFullName={ownerFullName}
          dogPhotoUri={draft.dogPhotoUri}
          humanPhotoUri={draft.humanPhotoUri}
          photoUploading={photoUploading}
          onPhotoChange={(field, uri) => void onPhotoChange(field, uri)}
        />

        <View style={styles.form}>
          {infoTab === 'owner' ? (
            <OwnerInfoFields draft={draft} setDraft={setDraft} />
          ) : (
            <PetInfoFields draft={draft} setDraft={setDraft} />
          )}
        </View>

        <ProfileTipBanner />

        <View style={styles.accountSection}>
          <Text style={styles.accountTitle}>Account</Text>
          <Pressable
            onPress={() => void openLegalUrl(PRIVACY_POLICY_URL)}
            style={({ pressed }) => [styles.legalBtn, pressed && styles.legalBtnPressed]}
            accessibilityRole="link"
            accessibilityLabel="Privacy policy">
            <Text style={styles.legalBtnText}>Privacy policy</Text>
          </Pressable>
          <Pressable
            onPress={() => void openLegalUrl(ACCOUNT_DELETION_INFO_URL)}
            style={({ pressed }) => [styles.legalBtn, pressed && styles.legalBtnPressed]}
            accessibilityRole="link"
            accessibilityLabel="How to delete your account">
            <Text style={styles.legalBtnText}>How to delete your account</Text>
          </Pressable>
          <Pressable
            onPress={() => setSignOutSheetOpen(true)}
            style={({ pressed }) => [styles.signOutBtn, pressed && styles.signOutBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Sign out">
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
          <Text style={styles.signOutHint}>Sign in with a different email to switch accounts.</Text>
          <Pressable
            onPress={() => setDeleteSheetOpen(true)}
            style={({ pressed }) => [styles.deleteAccountBtn, pressed && styles.signOutBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Delete account">
            <Text style={styles.signOutText}>Delete account</Text>
          </Pressable>
          <Text style={styles.signOutHint}>
            Permanently removes your profile, photos, posts, and chats from Paw Connection.
          </Text>
        </View>

        {isDirty || saving ? <View style={styles.saveScrollSpacer} /> : <View style={{ height: 24 }} />}
        </KeyboardAwareFormScroll>
      </View>

      {isDirty || saving ? (
        <View style={styles.saveSection}>
          <Pressable
            onPress={() => void onSave()}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && !saving && styles.saveBtnPressed,
              saving && styles.saveBtnDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel={saving ? 'Saving changes' : 'Save changes'}
            accessibilityState={{ disabled: saving, busy: saving }}>
            {saving ? (
              <ActivityIndicator size="small" color={PawColors.black} />
            ) : (
              <Image source={PROFILE_FIGMA.iconSaveCheck} style={styles.saveIcon} contentFit="contain" />
            )}
            <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function OwnerInfoFields({
  draft,
  setDraft,
}: {
  draft: ReturnType<typeof useProfileOnboarding>['draft'];
  setDraft: ReturnType<typeof useProfileOnboarding>['setDraft'];
}) {
  return (
    <>
      <ProfileLabeledField
        label="Full Name"
        icon="user"
        value={draft.fullName}
        onChangeText={(t) => setDraft({ fullName: t })}
        placeholder="Jefferson"
      />
      <ProfileLabeledField
        label="@ handle"
        icon="at-sign"
        value={draft.handle}
        onChangeText={(t) => setDraft({ handle: sanitizeHandleInput(t) })}
        placeholder="your_handle"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <ProfileLabeledField
        label="Email"
        icon="mail"
        value={draft.email}
        onChangeText={(t) => setDraft({ email: t })}
        placeholder="jefferson@pawpost.com"
        keyboardType="email-address"
      />
      <ProfileLabeledField
        label="Phone"
        icon="phone"
        value={draft.phone}
        onChangeText={(t) => setDraft({ phone: t })}
        placeholder="+1 (555) 123-4567"
        keyboardType="phone-pad"
      />
      <ProfileLabeledField
        label="Location"
        icon="map-pin"
        value={draft.location}
        onChangeText={(t) => setDraft({ location: t })}
        placeholder="Mosman, Sydney"
      />
      <ProfileLabeledField
        label="Bio"
        icon="heart"
        value={draft.humanBio}
        onChangeText={(t) => setDraft({ humanBio: t })}
        placeholder="Tell us about yourself and your pet..."
        multiline
      />
    </>
  );
}

function PetInfoFields({
  draft,
  setDraft,
}: {
  draft: ReturnType<typeof useProfileOnboarding>['draft'];
  setDraft: ReturnType<typeof useProfileOnboarding>['setDraft'];
}) {
  return (
    <>
      <ProfileLabeledField
        label="Name"
        icon="tag"
        value={draft.dogName}
        onChangeText={(t) => setDraft({ dogName: t })}
        placeholder="Your dog's name"
      />
      <ProfileLabeledField label="Birthday" icon="calendar">
        <BirthdayField
          value={draft.dogBirthday}
          onChangeIso={(iso) =>
            setDraft({
              dogBirthday: iso,
              dogAge: iso ? String(ageFromBirthdayIso(iso) ?? '') : '',
            })
          }
        />
      </ProfileLabeledField>
      <ProfileLabeledField label="Breed" icon="search">
        <BreedAutocomplete
          variant="profile"
          value={draft.breed}
          onChangeText={(t) => setDraft({ breed: t })}
          placeholder="Breed"
        />
      </ProfileLabeledField>
      <ProfileLabeledField label="About them" icon="file-text">
        <ProfileFieldInput
          multiline
          value={draft.dogBio}
          onChangeText={(t) => setDraft({ dogBio: t })}
          placeholder="Your pet's short bio, e.g. enjoys the park and not the water"
        />
      </ProfileLabeledField>
      <ProfileLabeledField label="Temperament" icon="smile">
        <OptionDropdown<TemperamentValue>
          multiple
          value={draft.temperament}
          options={TEMPERAMENT_DROPDOWN_OPTIONS}
          onChange={(v) => setDraft({ temperament: v })}
          sheetTitle="Temperament"
          accessibilityLabel="Temperament"
          variant="profile"
        />
      </ProfileLabeledField>
      <ProfileLabeledField label="Vaccinated" icon="shield">
        <OptionDropdown<VaccinatedValue>
          value={draft.vaccinated}
          options={VACCINATED_OPTIONS}
          onChange={(v) => setDraft({ vaccinated: v })}
          sheetTitle="Vaccinated"
          accessibilityLabel="Vaccinated"
          variant="profile"
        />
      </ProfileLabeledField>
      <ProfileLabeledField label="Desexed" icon="heart">
        <OptionDropdown<DesexedValue>
          value={draft.desexed}
          options={DESEXED_OPTIONS}
          onChange={(v) => setDraft({ desexed: v })}
          sheetTitle="Desexed"
          accessibilityLabel="Desexed"
          variant="profile"
        />
      </ProfileLabeledField>
      <ProfileLabeledField label="Gender" icon="users">
        <GenderSelector
          value={draft.dogGender}
          onChange={(v) => setDraft({ dogGender: v })}
          variant="profile"
        />
      </ProfileLabeledField>
      <View style={styles.enjoyList}>
        {ENJOY_ROWS.map((row) => (
          <EnjoyCheckboxRow
            key={row.key}
            label={row.label}
            checked={draft[row.key]}
            onToggle={() => setDraft({ [row.key]: !draft[row.key] })}
          />
        ))}
        <EnjoyCheckboxRow
          label="Others"
          checked={draft.dogEnjoysOthers}
          onToggle={() => {
            const next = !draft.dogEnjoysOthers;
            setDraft(
              next
                ? { dogEnjoysOthers: true }
                : { dogEnjoysOthers: false, favoritesThings: '' },
            );
          }}
        />
        {draft.dogEnjoysOthers ? (
          <ProfileLabeledField
            label="Favorite things to do"
            icon="star"
            value={draft.favoritesThings}
            onChangeText={(t) => setDraft({ favoritesThings: t })}
            placeholder="Your pet's favorites things to do"
          />
        ) : null}
      </View>
      <ProfileLabeledField
        label="Favorite meal"
        icon="coffee"
        value={draft.favoriteMeal}
        onChangeText={(t) => setDraft({ favoriteMeal: t })}
        placeholder="Your pet's favorite meal"
      />
    </>
  );
}

function EnjoyCheckboxRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={styles.enjoyRow}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}>
      <Text style={styles.enjoyLabel}>{label}</Text>
      <View style={[styles.lavenderCircle, checked && styles.lavenderCircleFilled]}>
        {checked ? <Text style={styles.lavenderCheckmark}>✓</Text> : null}
      </View>
    </Pressable>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 64,
    borderBottomWidth: 2,
    borderBottomColor: PawColors.profileHeaderBorder,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '700',
    color: PawColors.profileBrown,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: PawLayout.horizontalPadding,
    paddingTop: 32,
    gap: 24,
  },
  switchWrap: {
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  enjoyList: {
    gap: 18,
    marginTop: -4,
    marginBottom: 4,
  },
  enjoyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  enjoyLabel: {
    fontSize: PawFontSize.body,
    fontWeight: '400',
    color: PawColors.profileBrown,
    flex: 1,
    paddingRight: 12,
  },
  lavenderCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: PawColors.checkboxLavender,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lavenderCircleFilled: {
    backgroundColor: PawColors.checkboxLavender,
    borderColor: PawColors.checkboxLavender,
  },
  lavenderCheckmark: {
    color: PawColors.fieldWhite,
    fontSize: PawFontSize.small,
    fontWeight: '600',
    marginTop: -1,
  },
  saveScrollSpacer: {
    height: 88,
  },
  saveSection: {
    paddingHorizontal: PawLayout.horizontalPadding,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: PawColors.creamBg,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: PawColors.peach,
    borderWidth: 3,
    borderColor: PawColors.black,
    borderRadius: 16,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  saveBtnPressed: {
    opacity: 0.9,
  },
  saveBtnDisabled: {
    opacity: 0.72,
  },
  saveIcon: {
    width: 16,
    height: 16,
  },
  saveText: {
    fontSize: PawFontSize.subtitle,
    lineHeight: PawLineHeight.title,
    fontWeight: '800',
    color: PawColors.black,
  },
  accountSection: {
    marginTop: 8,
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: PawColors.profileHeaderBorder,
  },
  accountTitle: {
    fontSize: PawFontSize.small,
    fontWeight: '700',
    color: PawColors.profileBrown,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  signOutBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: PawLayout.borderRadiusField,
    borderWidth: 2,
    borderColor: PawColors.destructive,
    backgroundColor: PawColors.destructiveMuted,
  },
  deleteAccountBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: PawLayout.borderRadiusField,
    borderWidth: 2,
    borderColor: PawColors.destructive,
    backgroundColor: PawColors.fieldWhite,
  },
  legalBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: PawLayout.borderRadiusField,
    borderWidth: 2,
    borderColor: PawColors.black,
    backgroundColor: PawColors.fieldWhite,
  },
  legalBtnPressed: {
    opacity: 0.85,
  },
  legalBtnText: {
    fontSize: PawFontSize.body,
    fontWeight: '700',
    color: PawColors.black,
  },
  signOutBtnPressed: {
    opacity: 0.85,
  },
  signOutText: {
    fontSize: PawFontSize.body,
    fontWeight: '700',
    color: PawColors.destructive,
  },
  signOutHint: {
    fontSize: PawFontSize.caption,
    fontWeight: '300',
    color: PawColors.textMuted,
    lineHeight: PawLineHeight.caption,
  },
});
