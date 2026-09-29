import DateTimePicker from '@react-native-community/datetimepicker';
import Feather from '@expo/vector-icons/Feather';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';
import {
  birthdayBounds,
  formatBirthdayDisplay,
  interpretBirthday,
  maskBirthdayTyping,
  ownerBirthdayRules,
  petBirthdayRules,
  type BirthdayRules,
} from '@/lib/pet-birthday';

type BirthdayFieldProps = {
  /** Stored value as YYYY-MM-DD (or empty). */
  value: string;
  onChangeIso: (iso: string) => void;
  placeholder?: string;
  kind?: 'pet' | 'owner';
  /** `profile` matches ProfileFieldInput. `default` matches the setup form fields. */
  variant?: 'default' | 'profile';
};

function isoToLocalDate(iso: string, fallback: Date): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return fallback;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function localDateToIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Birthday text field (DD/MM/YYYY) plus a calendar picker.
 * Both write the same YYYY-MM-DD value.
 */
export function BirthdayField({
  value,
  onChangeIso,
  placeholder = 'DD/MM/YYYY',
  kind = 'pet',
  variant = 'default',
}: BirthdayFieldProps) {
  const rules: BirthdayRules = useMemo(
    () => (kind === 'owner' ? ownerBirthdayRules() : petBirthdayRules()),
    [kind],
  );
  const [text, setText] = useState(() => formatBirthdayDisplay(value));
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const bounds = birthdayBounds(rules);
  const pickerValue = isoToLocalDate(value, bounds.maximumDate);

  useEffect(() => {
    const display = formatBirthdayDisplay(value);
    setText((current) => {
      const typed = interpretBirthday(current, rules);
      if (value === (typed.iso ?? '')) return current;
      return display;
    });
  }, [rules, value]);

  const commitText = (raw: string) => {
    const masked = maskBirthdayTyping(raw);
    setText(masked);
    if (!masked) {
      setError(null);
      onChangeIso('');
      return;
    }
    const result = interpretBirthday(masked, rules);
    setError(result.error);
    if (result.iso) onChangeIso(result.iso);
    else if (result.error) onChangeIso('');
  };

  const commitDate = (date: Date) => {
    const iso = localDateToIso(date);
    const result = interpretBirthday(iso, rules);
    setText(formatBirthdayDisplay(result.iso ?? ''));
    setError(result.error);
    onChangeIso(result.iso ?? '');
  };

  return (
    <View>
      <View style={[styles.field, variant === 'profile' && styles.fieldProfile]}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={
            variant === 'profile' ? 'rgba(51,32,21,0.5)' : PawColors.textPlaceholder
          }
          value={text}
          onChangeText={commitText}
          keyboardType="number-pad"
          maxLength={10}
          style={[styles.input, variant === 'profile' && styles.inputProfile]}
          accessibilityLabel={kind === 'owner' ? 'Date of birth' : 'Birthday'}
          accessibilityHint="Enter the date as day, month, year, or open the calendar"
        />
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={styles.calendarBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Open calendar"
          accessibilityHint="Choose the date from a calendar">
          <Feather
            name="calendar"
            size={20}
            color={variant === 'profile' ? PawColors.profileBrown : PawColors.black}
          />
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {pickerOpen && Platform.OS === 'android' ? (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display="calendar"
          minimumDate={bounds.minimumDate}
          maximumDate={bounds.maximumDate}
          onChange={(event, date) => {
            setPickerOpen(false);
            if (event.type === 'dismissed' || !date) return;
            commitDate(date);
          }}
        />
      ) : null}
      {Platform.OS === 'ios' ? (
        <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              <DateTimePicker
                value={pickerValue}
                mode="date"
                display="spinner"
                minimumDate={bounds.minimumDate}
                maximumDate={bounds.maximumDate}
                onChange={(_event, date) => {
                  if (date) commitDate(date);
                }}
              />
              <Pressable onPress={() => setPickerOpen(false)} style={styles.done}>
                <Text style={styles.doneText}>Done</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
      {pickerOpen && Platform.OS === 'web' ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              <DateTimePicker
                value={pickerValue}
                mode="date"
                display="default"
                minimumDate={bounds.minimumDate}
                maximumDate={bounds.maximumDate}
                onChange={(_event, date) => {
                  setPickerOpen(false);
                  if (date) commitDate(date);
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PawColors.fieldGray,
    borderWidth: 1,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusField,
    minHeight: 50,
    paddingHorizontal: 16,
    gap: 8,
  },
  fieldProfile: {
    backgroundColor: PawColors.fieldWhite,
    borderWidth: 2,
    borderColor: PawColors.profileFieldBorder,
    borderRadius: 12,
    minHeight: 50.5,
  },
  input: {
    flex: 1,
    fontSize: PawFontSize.body,
    lineHeight: PawLineHeight.body,
    fontWeight: '300',
    color: PawColors.black,
    paddingVertical: 0,
  },
  inputProfile: {
    fontWeight: '400',
    color: PawColors.profileBrown,
  },
  calendarBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    marginTop: 6,
    color: PawColors.navLabelActive,
    fontSize: PawFontSize.body,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: PawColors.creamBg,
    paddingBottom: 24,
  },
  done: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  doneText: {
    fontSize: PawFontSize.body,
    fontWeight: '700',
    color: PawColors.black,
  },
});
