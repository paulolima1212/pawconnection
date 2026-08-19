import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';

export type ChipOption<T extends string> = { value: T; label: string };

type ChipOptionDropdownProps<T extends string> = {
  value: T;
  options: readonly ChipOption<T>[];
  onChange: (value: T) => void;
  sheetTitle: string;
  accessibilityLabel: string;
  accessibilityHint?: string;
  /** When true, chip shows a subtle loading cue (label unchanged). */
  busy?: boolean;
  /** Limits chip width in tight rows (e.g. “All posts”). */
  compact?: boolean;
};

export function ChipOptionDropdown<T extends string>({
  value,
  options,
  onChange,
  sheetTitle,
  accessibilityLabel,
  accessibilityHint,
  busy = false,
  compact = false,
}: ChipOptionDropdownProps<T>) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const listMaxHeight = Math.round(windowHeight * 0.5);
  const [open, setOpen] = useState(false);
  const label = options.find((o) => o.value === value)?.label ?? options[0]?.label ?? '';

  return (
    <View style={compact ? styles.wrapCompact : styles.wrap}>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={options.length === 0}
        style={({ pressed }) => [
          styles.chip,
          compact && styles.chipCompact,
          pressed && styles.chipPressed,
          busy && styles.chipBusy,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint ?? 'Opens list of options'}>
        <Text style={styles.chipText} numberOfLines={1}>
          {label}
        </Text>
        <Feather name="chevron-down" size={20} color={PawColors.black} />
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
              {options.map((opt, index) => (
                <Pressable
                  key={String(opt.value)}
                  onPress={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  style={[styles.sheetRow, index < options.length - 1 && styles.sheetRowBorder]}>
                  <Text style={[styles.sheetRowText, opt.value === value && styles.sheetRowTextSelected]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexShrink: 0,
    maxWidth: '100%',
  },
  wrapCompact: {
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '48%',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PawColors.fieldWhite,
    borderWidth: 0.7,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusPill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    maxWidth: '100%',
  },
  chipCompact: {
    flexShrink: 1,
  },
  chipPressed: {
    opacity: 0.88,
  },
  chipBusy: {
    opacity: 0.75,
  },
  chipText: {
    fontSize: PawFontSize.body,
    lineHeight: PawLineHeight.body,
    fontWeight: '300',
    color: PawColors.black,
    flexShrink: 1,
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
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  sheetRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PawColors.black,
  },
  sheetRowText: {
    fontSize: PawFontSize.body,
    lineHeight: PawLineHeight.body,
    fontWeight: '300',
    color: PawColors.black,
  },
  sheetRowTextSelected: {
    fontWeight: '700',
  },
});
