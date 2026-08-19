import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BirthdayField } from '@/components/paw/birthday-field';
import { BreedAutocomplete } from '@/components/paw/breed-autocomplete';
import { FieldInput } from '@/components/paw/field-input';
import { GenderSelector } from '@/components/paw/gender-selector';
import { KeyboardAwareFormScroll } from '@/components/paw/keyboard-aware-form-scroll';
import { OptionDropdown } from '@/components/paw/option-dropdown';
import { PawLogo } from '@/components/paw/paw-logo';
import { ProfilePhotoSlot } from '@/components/paw/profile-photo-slot';
import { FIGMA_SETUP_DOG } from '@/constants/paw-figma-assets';
import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';
import {
  TEMPERAMENT_OPTIONS,
  type DesexedValue,
  type TemperamentValue,
  type VaccinatedValue,
  useProfileOnboarding,
} from '@/context/profile-onboarding';
import { ageFromBirthdayIso } from '@/lib/pet-birthday';

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

export default function SetupDogScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft, setDraft } = useProfileOnboarding();

  const canNext = draft.dogName.trim().length > 0;

  const onBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/interests');
  };

  const onNext = () => {
    if (!canNext) return;
    router.push('/setup-you');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <KeyboardAwareFormScroll
        contentContainerStyle={styles.scroll}
        keyboardVerticalOffset={insets.top}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} hitSlop={12}>
            <Image source={FIGMA_SETUP_DOG.back} style={styles.back} contentFit="contain" />
          </Pressable>
          <PawLogo variant="mark" width={152} height={96} />
          <View style={styles.backSpacer} />
        </View>
        <Text style={styles.headline}>Let&apos;s build your doggo&apos;s profile!</Text>
        <View style={styles.illusWrap}>
          <Image source={FIGMA_SETUP_DOG.dogIllustration} style={styles.illus} contentFit="cover" />
        </View>
        <Text style={styles.intro}>
          We&apos;ll use this information to showcase on your profile and help you connect with other dog
          owners and find dog-friendly places nearby.
        </Text>
        <Text style={styles.sectionTitle}>Your doggo</Text>
        <Text style={styles.profilePicLabel}>
          <Text style={styles.label}>Profile picture </Text>
          <Text style={styles.optional}>(optional)</Text>
        </Text>
        <ProfilePhotoSlot
          iconVariant="dog"
          imageUri={draft.dogPhotoUri}
          onImageChange={(uri) => setDraft({ dogPhotoUri: uri })}
        />
        <View style={styles.form}>
          <LabeledBlock label="Name">
            <FieldInput
              placeholder="Your dog’s name"
              value={draft.dogName}
              onChangeText={(t) => setDraft({ dogName: t })}
            />
          </LabeledBlock>
          <LabeledBlock label="Birthday">
            <BirthdayField
              value={draft.dogBirthday}
              onChangeIso={(iso) =>
                setDraft({
                  dogBirthday: iso,
                  dogAge: iso ? String(ageFromBirthdayIso(iso) ?? '') : '',
                })
              }
            />
          </LabeledBlock>
          <LabeledBlock label="Breed">
            <BreedAutocomplete
              value={draft.breed}
              onChangeText={(t) => setDraft({ breed: t })}
              placeholder="Breed"
            />
          </LabeledBlock>
          <View style={styles.bioBlock}>
            <Text style={styles.label}>About them</Text>
            <Text style={styles.thinHint}>Write up to 200 words</Text>
            <FieldInput
              placeholder="Your pet's short bio, e.g. enjoys the park and not the water"
              multiline
              value={draft.dogBio}
              onChangeText={(t) => setDraft({ dogBio: t })}
              style={styles.bioInput}
            />
          </View>
          <LabeledBlock label="Temperament">
            <OptionDropdown<TemperamentValue>
              multiple
              value={draft.temperament}
              options={TEMPERAMENT_DROPDOWN_OPTIONS}
              onChange={(v) => setDraft({ temperament: v })}
              sheetTitle="Temperament"
              accessibilityLabel="Temperament"
              accessibilityHint="Opens list to choose one or more temperaments"
              placeholder="Select temperament"
            />
          </LabeledBlock>
          <LabeledBlock label="Vaccinated">
            <OptionDropdown<VaccinatedValue>
              value={draft.vaccinated}
              options={VACCINATED_OPTIONS}
              onChange={(v) => setDraft({ vaccinated: v })}
              sheetTitle="Vaccinated"
              accessibilityLabel="Vaccinated"
              accessibilityHint="Opens list to choose Yes or No"
              placeholder="Select an option"
            />
          </LabeledBlock>
          <LabeledBlock label="Desexed">
            <OptionDropdown<DesexedValue>
              value={draft.desexed}
              options={DESEXED_OPTIONS}
              onChange={(v) => setDraft({ desexed: v })}
              sheetTitle="Desexed"
              accessibilityLabel="Desexed"
              accessibilityHint="Opens list to choose Yes or No"
              placeholder="Select an option"
            />
          </LabeledBlock>
          <LabeledBlock label="Gender">
            <GenderSelector value={draft.dogGender} onChange={(v) => setDraft({ dogGender: v })} />
          </LabeledBlock>
          <View style={styles.enjoyCheckboxList}>
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
              <LabeledBlock label="Favorites things to do">
                <FieldInput
                  placeholder="Your pet’s favorites things to do"
                  value={draft.favoritesThings}
                  onChangeText={(t) => setDraft({ favoritesThings: t })}
                />
              </LabeledBlock>
            ) : null}
          </View>
          <LabeledBlock label="Favorite meal">
            <FieldInput
              variant="white"
              placeholder="Your pet's favorite meal"
              value={draft.favoriteMeal}
              onChangeText={(t) => setDraft({ favoriteMeal: t })}
            />
          </LabeledBlock>
        </View>
        <Pressable
          onPress={onNext}
          style={[styles.completeBtn, !canNext && styles.completeBtnDisabled]}
          disabled={!canNext}>
          <Text style={styles.completeText}>Next</Text>
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
  backSpacer: { width: 32, height: 32 },
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
    marginTop: 24,
    width: 181,
    height: 181,
    borderRadius: 90.5,
    overflow: 'hidden',
  },
  illus: {
    width: '100%',
    height: '100%',
  },
  intro: {
    marginTop: 20,
    fontSize: PawFontSize.body,
    fontWeight: '300',
    color: PawColors.black,
    textAlign: 'center',
    lineHeight: PawLineHeight.body,
    letterSpacing: 0.32,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    marginTop: 32,
    fontSize: PawFontSize.title,
    fontWeight: '800',
    color: PawColors.black,
    letterSpacing: 0.22,
  },
  profilePicLabel: {
    marginTop: 8,
  },
  label: {
    fontSize: PawFontSize.body,
    fontWeight: '300',
    color: PawColors.black,
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
  enjoyCheckboxList: {
    gap: 18,
    marginTop: 4,
    marginBottom: 10,
  },
  enjoyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  enjoyLabel: {
    fontSize: PawFontSize.body,
    fontWeight: '300',
    color: PawColors.black,
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
