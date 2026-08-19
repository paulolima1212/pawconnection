import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  INTEREST_OPTIONS,
  type GenderValue,
  type InterestId,
} from '@/context/profile-onboarding';
import type { DiscoverAdvancedFilters } from '@/constants/discover';
import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';

type DiscoverAdvancedFiltersSheetProps = {
  visible: boolean;
  value: DiscoverAdvancedFilters;
  onChange: (value: DiscoverAdvancedFilters) => void;
  onClose: () => void;
};

type FilterSectionProps<T extends string> = {
  title: string;
  options: readonly { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
};

function FilterSection<T extends string>({
  title,
  options,
  selected,
  onSelect,
}: FilterSectionProps<T>) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {options.map((opt, index) => (
        <Pressable
          key={String(opt.value)}
          onPress={() => onSelect(opt.value)}
          style={[styles.row, index < options.length - 1 && styles.rowBorder]}>
          <Text style={[styles.rowText, opt.value === selected && styles.rowTextSelected]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const GENDER_OPTIONS: { value: GenderValue | 'any'; label: string }[] = [
  { value: 'any', label: 'Any' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
];

const INTEREST_FILTER_OPTIONS: { value: InterestId | 'any'; label: string }[] = [
  { value: 'any', label: 'Any' },
  ...INTEREST_OPTIONS.map((option) => ({ value: option, label: option })),
];

export function DiscoverAdvancedFiltersSheet({
  visible,
  value,
  onChange,
  onClose,
}: DiscoverAdvancedFiltersSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.dim} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: Math.max(16, insets.bottom + 8) }]}>
          <Text style={styles.title}>Advanced filters</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <FilterSection
              title="Owner gender"
              options={GENDER_OPTIONS}
              selected={value.ownerGender}
              onSelect={(ownerGender) => onChange({ ...value, ownerGender })}
            />
            <FilterSection
              title="Pet gender"
              options={GENDER_OPTIONS}
              selected={value.petGender}
              onSelect={(petGender) => onChange({ ...value, petGender })}
            />
            <FilterSection
              title="Interests"
              options={INTEREST_FILTER_OPTIONS}
              selected={value.interest}
              onSelect={(interest) => onChange({ ...value, interest })}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: PawColors.whiteCard,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: PawColors.black,
    paddingTop: 12,
    paddingHorizontal: 8,
    maxHeight: '75%',
  },
  title: {
    fontSize: PawFontSize.small,
    lineHeight: PawLineHeight.small,
    fontWeight: '600',
    color: PawColors.textMuted,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: PawFontSize.body,
    fontWeight: '700',
    color: PawColors.black,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PawColors.black,
  },
  rowText: {
    fontSize: PawFontSize.body,
    lineHeight: PawLineHeight.body,
    fontWeight: '300',
    color: PawColors.black,
  },
  rowTextSelected: {
    fontWeight: '700',
  },
});
