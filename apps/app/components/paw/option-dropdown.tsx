import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';

export type DropdownOption<T extends string> = { value: T; label: string };

type OptionDropdownBaseProps<T extends string> = {
  options: readonly DropdownOption<T>[];
  sheetTitle: string;
  accessibilityLabel: string;
  accessibilityHint?: string;
  placeholder?: string;
  variant?: 'default' | 'profile';
};

type OptionDropdownSingleProps<T extends string> = OptionDropdownBaseProps<T> & {
  multiple?: false;
  value: T | '';
  onChange: (value: T) => void;
};

type OptionDropdownMultiProps<T extends string> = OptionDropdownBaseProps<T> & {
  multiple: true;
  value: readonly T[];
  onChange: (value: T[]) => void;
};

export type OptionDropdownProps<T extends string> =
  | OptionDropdownSingleProps<T>
  | OptionDropdownMultiProps<T>;

export function OptionDropdown<T extends string>(props: OptionDropdownProps<T>) {
  const {
    options,
    sheetTitle,
    accessibilityLabel,
    accessibilityHint,
    placeholder = 'Select an option',
    variant = 'default',
  } = props;
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const listMaxHeight = Math.round(windowHeight * 0.45);
  const [open, setOpen] = useState(false);
  const isMultiple = props.multiple === true;

  const selectedSet = new Set<string>(
    isMultiple ? props.value : props.value !== '' ? [props.value] : [],
  );
  const hasValue = selectedSet.size > 0;
  const label = hasValue
    ? options
        .filter((o) => selectedSet.has(o.value))
        .map((o) => o.label)
        .join(', ')
    : placeholder;

  const toggleMulti = (optValue: T) => {
    if (!isMultiple) return;
    const current = [...props.value];
    const idx = current.indexOf(optValue);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(optValue);
    props.onChange(current);
  };

  return (
    <View>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.field,
          variant === 'profile' && styles.fieldProfile,
          pressed && styles.fieldPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}>
        <Text
          style={[styles.valueText, !hasValue && styles.placeholderText]}
          numberOfLines={2}>
          {label}
        </Text>
        <Feather name="chevron-down" size={22} color={PawColors.black} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable
            style={[StyleSheet.absoluteFillObject, styles.dim]}
            onPress={() => setOpen(false)}
            accessibilityLabel="Close"
          />
          <View style={[styles.sheet, { paddingBottom: Math.max(16, insets.bottom + 8) }]}>
            <Text style={styles.sheetTitle}>{sheetTitle}</Text>
            <ScrollView
              style={[styles.sheetScroll, { maxHeight: listMaxHeight }]}
              contentContainerStyle={styles.sheetScrollContent}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              showsVerticalScrollIndicator>
              {options.map((opt, index) => {
                const selected = selectedSet.has(opt.value);
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      if (isMultiple) {
                        toggleMulti(opt.value);
                      } else {
                        props.onChange(opt.value);
                        setOpen(false);
                      }
                    }}
                    style={[styles.sheetRow, index < options.length - 1 && styles.sheetRowBorder]}
                    accessibilityRole={isMultiple ? 'checkbox' : 'button'}
                    accessibilityState={isMultiple ? { checked: selected } : undefined}>
                    <Text style={[styles.sheetRowText, selected && styles.sheetRowTextSelected]}>
                      {opt.label}
                    </Text>
                    {isMultiple ? (
                      <View style={[styles.checkCircle, selected && styles.checkCircleFilled]}>
                        {selected ? <Text style={styles.checkMark}>✓</Text> : null}
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            {isMultiple ? (
              <Pressable
                onPress={() => setOpen(false)}
                style={styles.doneBtn}
                accessibilityRole="button"
                accessibilityLabel="Done">
                <Text style={styles.doneBtnText}>Done</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PawColors.fieldGray,
    borderWidth: 1,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusField,
    minHeight: 50,
    paddingHorizontal: 16,
    gap: 10,
  },
  fieldProfile: {
    backgroundColor: PawColors.fieldWhite,
    borderWidth: 2,
    borderColor: PawColors.profileFieldBorder,
    borderRadius: 12,
    minHeight: 50.5,
  },
  fieldPressed: {
    opacity: 0.85,
  },
  valueText: {
    flex: 1,
    fontSize: PawFontSize.body,
    lineHeight: PawLineHeight.body,
    fontWeight: '300',
    color: PawColors.black,
  },
  placeholderText: {
    color: PawColors.textPlaceholder,
  },
  modalRoot: {
    flex: 1,
  },
  dim: {
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
  },
  sheetTitle: {
    fontSize: PawFontSize.small,
    lineHeight: PawLineHeight.small,
    fontWeight: '600',
    color: PawColors.textMuted,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  sheetScroll: {
    flexGrow: 0,
  },
  sheetScrollContent: {
    flexGrow: 1,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 12,
  },
  sheetRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PawColors.black,
  },
  sheetRowText: {
    flex: 1,
    fontSize: PawFontSize.body,
    lineHeight: PawLineHeight.body,
    fontWeight: '300',
    color: PawColors.black,
  },
  sheetRowTextSelected: {
    fontWeight: '700',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: PawColors.checkboxLavender,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleFilled: {
    backgroundColor: PawColors.checkboxLavender,
    borderColor: PawColors.checkboxLavender,
  },
  checkMark: {
    color: PawColors.fieldWhite,
    fontSize: PawFontSize.small,
    fontWeight: '600',
    marginTop: -1,
  },
  doneBtn: {
    marginTop: 8,
    marginHorizontal: 4,
    backgroundColor: PawColors.peachBorder,
    borderWidth: 2,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusField,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: PawFontSize.body,
    fontWeight: '800',
    color: PawColors.black,
  },
});
