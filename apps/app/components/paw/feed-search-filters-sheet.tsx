import Feather from '@expo/vector-icons/Feather';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChipOptionDropdown } from '@/components/paw/chip-option-dropdown';
import { KeyboardAwareFormScroll } from '@/components/paw/keyboard-aware-form-scroll';
import {
  EMPTY_FEED_SEARCH_FILTERS,
  FEED_PET_GENDER_FILTER_OPTIONS,
  FEED_PET_SIZE_FILTER_OPTIONS,
  type FeedSearchFilters,
} from '@/constants/feed-search-filters';
import type { GenderValue } from '@/context/profile-onboarding';
import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';

type FeedSearchFiltersSheetProps = {
  visible: boolean;
  initialFilters: FeedSearchFilters;
  onClose: () => void;
  onApply: (filters: FeedSearchFilters) => void;
};

export function FeedSearchFiltersSheet({
  visible,
  initialFilters,
  onClose,
  onApply,
}: FeedSearchFiltersSheetProps) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<FeedSearchFilters>(initialFilters);

  useEffect(() => {
    if (visible) setDraft(initialFilters);
  }, [visible, initialFilters]);

  const setField = <K extends keyof FeedSearchFilters>(key: K, value: FeedSearchFilters[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={[StyleSheet.absoluteFillObject, styles.dim]} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(16, insets.bottom + 12) }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Search filters</Text>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close filters">
              <Feather name="x" size={24} color={PawColors.black} />
            </Pressable>
          </View>

          <KeyboardAwareFormScroll
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}>
            <Text style={styles.label}>City</Text>
            <TextInput
              value={draft.city ?? ''}
              onChangeText={(t) => setField('city', t)}
              placeholder="e.g. Austin, Pinheiros"
              placeholderTextColor={PawColors.searchPlaceholder}
              style={styles.input}
              accessibilityLabel="Filter by city"
            />

            <Text style={styles.label}>Author or pet name</Text>
            <TextInput
              value={draft.author ?? ''}
              onChangeText={(t) => setField('author', t)}
              placeholder="Owner or dog name"
              placeholderTextColor={PawColors.searchPlaceholder}
              style={styles.input}
              accessibilityLabel="Filter by author"
            />

            <Text style={styles.label}>Pet gender</Text>
            <ChipOptionDropdown<GenderValue | ''>
              value={draft.petGender ?? ''}
              options={FEED_PET_GENDER_FILTER_OPTIONS}
              onChange={(v) => setField('petGender', v)}
              sheetTitle="Pet gender"
              accessibilityLabel="Pet gender filter"
            />

            <Text style={styles.label}>Pet age (years)</Text>
            <TextInput
              value={draft.petAge ?? ''}
              onChangeText={(t) => setField('petAge', t.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 3"
              placeholderTextColor={PawColors.searchPlaceholder}
              style={styles.input}
              keyboardType="number-pad"
              accessibilityLabel="Filter by pet age"
            />

            <Text style={styles.label}>Pet size</Text>
            <ChipOptionDropdown<'' | 'small' | 'medium' | 'large'>
              value={draft.petSize ?? ''}
              options={FEED_PET_SIZE_FILTER_OPTIONS}
              onChange={(v) => setField('petSize', v)}
              sheetTitle="Pet size"
              accessibilityLabel="Pet size filter"
            />
          </KeyboardAwareFormScroll>

          <View style={styles.actions}>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => {
                setDraft(EMPTY_FEED_SEARCH_FILTERS);
                onApply(EMPTY_FEED_SEARCH_FILTERS);
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel="Clear all filters">
              <Text style={styles.secondaryBtnText}>Clear</Text>
            </Pressable>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => {
                onApply(draft);
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel="Apply filters">
              <Text style={styles.primaryBtnText}>Apply</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dim: {
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: PawColors.creamBg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: PawColors.black,
    borderBottomWidth: 0,
    maxHeight: '88%',
    paddingTop: 16,
    paddingHorizontal: PawLayout.horizontalPadding,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: PawFontSize.subtitle,
    fontWeight: '700',
    color: PawColors.black,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: 8,
    paddingBottom: 12,
  },
  label: {
    marginTop: 8,
    fontSize: PawFontSize.small,
    fontWeight: '600',
    color: PawColors.black,
  },
  input: {
    backgroundColor: PawColors.fieldWhite,
    borderWidth: 1,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusField,
    minHeight: 48,
    paddingHorizontal: 14,
    fontSize: PawFontSize.body,
    fontWeight: '300',
    color: PawColors.black,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  secondaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: PawLayout.borderRadiusField,
    borderWidth: 1,
    borderColor: PawColors.black,
    backgroundColor: PawColors.fieldWhite,
  },
  secondaryBtnText: {
    fontSize: PawFontSize.body,
    fontWeight: '600',
    color: PawColors.black,
  },
  primaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: PawLayout.borderRadiusField,
    borderWidth: 2,
    borderColor: PawColors.black,
    backgroundColor: PawColors.peachBorder,
  },
  primaryBtnText: {
    fontSize: PawFontSize.body,
    fontWeight: '800',
    color: PawColors.black,
  },
});
