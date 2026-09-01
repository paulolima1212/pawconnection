import Feather from '@expo/vector-icons/Feather';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';
import {
  REPORT_REASON_LABELS,
  REPORT_REASONS,
  type ReportReason,
} from '@/lib/api/moderation';

type ReportPostSheetProps = {
  visible: boolean;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason, details?: string) => void;
};

export function ReportPostSheet({
  visible,
  submitting = false,
  onClose,
  onSubmit,
}: ReportPostSheetProps) {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (!visible) {
      setReason(null);
      setDetails('');
    }
  }, [visible]);

  const close = () => {
    if (submitting) return;
    setReason(null);
    setDetails('');
    onClose();
  };

  const submit = () => {
    if (!reason || submitting) return;
    onSubmit(reason, details.trim() || undefined);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.root}>
        <Pressable
          style={[StyleSheet.absoluteFillObject, styles.backdrop]}
          onPress={close}
          accessibilityLabel="Close"
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(20, insets.bottom + 12) }]}>
          <View style={styles.handle} accessibilityElementsHidden />
          <View style={styles.iconWrap}>
            <Feather name="flag" size={22} color={PawColors.destructive} />
          </View>
          <Text style={styles.title}>Report this post</Text>
          <Text style={styles.subtitle}>
            Reports are reviewed by the Paw Connection team. The author is not notified.
          </Text>

          <View style={styles.reasonsCard}>
            {REPORT_REASONS.map((value, index) => {
              const selected = reason === value;
              const meta = REPORT_REASON_LABELS[value];
              return (
                <View key={value}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <Pressable
                    onPress={() => setReason(value)}
                    style={({ pressed }) => [
                      styles.reasonRow,
                      selected && styles.reasonRowSelected,
                      pressed && styles.reasonRowPressed,
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={meta.label}>
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected ? <View style={styles.radioDot} /> : null}
                    </View>
                    <View style={styles.reasonText}>
                      <Text style={styles.reasonLabel}>{meta.label}</Text>
                      <Text style={styles.reasonHint}>{meta.hint}</Text>
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>

          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Optional details"
            placeholderTextColor={PawColors.searchPlaceholder}
            style={styles.details}
            multiline
            maxLength={500}
            editable={!submitting}
            accessibilityLabel="Optional report details"
          />

          <Pressable
            onPress={submit}
            disabled={!reason || submitting}
            style={({ pressed }) => [
              styles.submitBtn,
              (!reason || submitting) && styles.submitBtnDisabled,
              pressed && reason && !submitting && styles.submitBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Submit report">
            {submitting ? (
              <ActivityIndicator color={PawColors.fieldWhite} />
            ) : (
              <Text style={styles.submitText}>Submit report</Text>
            )}
          </Pressable>
          <Pressable
            onPress={close}
            disabled={submitting}
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Cancel">
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(51, 32, 21, 0.45)' },
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
  iconWrap: {
    alignSelf: 'center',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: PawColors.destructive,
    backgroundColor: PawColors.destructiveMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: PawFontSize.title,
    fontWeight: '700',
    color: PawColors.black,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: PawFontSize.body,
    fontWeight: '400',
    color: PawColors.textMuted,
    textAlign: 'center',
    lineHeight: PawLineHeight.body,
  },
  reasonsCard: {
    backgroundColor: PawColors.whiteCard,
    borderRadius: PawLayout.borderRadiusCard + 3,
    borderWidth: 1,
    borderColor: PawColors.black,
    overflow: 'hidden',
    marginBottom: 12,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  reasonRowSelected: { backgroundColor: PawColors.profileTipBg },
  reasonRowPressed: { opacity: 0.92 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: PawColors.black,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PawColors.fieldWhite,
  },
  radioSelected: { borderColor: PawColors.profileBrown },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PawColors.profileBrown,
  },
  reasonText: { flex: 1, gap: 2 },
  reasonLabel: {
    fontSize: PawFontSize.body,
    fontWeight: '600',
    color: PawColors.black,
  },
  reasonHint: {
    fontSize: PawFontSize.caption,
    fontWeight: '300',
    color: PawColors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: PawColors.profileHeaderBorder,
    marginHorizontal: 14,
  },
  details: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusField,
    backgroundColor: PawColors.fieldWhite,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: PawFontSize.body,
    color: PawColors.black,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  submitBtn: {
    minHeight: 50,
    borderRadius: PawLayout.borderRadiusField,
    borderWidth: 2,
    borderColor: PawColors.destructive,
    backgroundColor: PawColors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnPressed: { opacity: 0.9 },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: {
    fontSize: PawFontSize.body,
    fontWeight: '700',
    color: PawColors.fieldWhite,
  },
  cancelBtn: {
    marginTop: 10,
    minHeight: 50,
    borderRadius: PawLayout.borderRadiusField,
    borderWidth: 1,
    borderColor: PawColors.black,
    backgroundColor: PawColors.fieldWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnPressed: { opacity: 0.88 },
  cancelText: {
    fontSize: PawFontSize.body,
    fontWeight: '600',
    color: PawColors.black,
  },
});
