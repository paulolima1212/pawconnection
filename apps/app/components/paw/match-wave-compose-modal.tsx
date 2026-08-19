import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MATCH_WAVE_DEFAULT_MESSAGE } from '@/constants/match-feed';
import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';

type MatchWaveComposeModalProps = {
  visible: boolean;
  recipientName: string;
  message: string;
  busy?: boolean;
  onChangeMessage: (text: string) => void;
  onClose: () => void;
  onSend: () => void;
};

export function MatchWaveComposeModal({
  visible,
  recipientName,
  message,
  busy = false,
  onChangeMessage,
  onClose,
  onSend,
}: MatchWaveComposeModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.dim} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: Math.max(16, insets.bottom + 8) }]}>
          <Text style={styles.title}>Say hi to {recipientName}</Text>
          <Text style={styles.subtitle}>
            Sends your message and a friend request — you stay on Find
          </Text>
          <TextInput
            value={message}
            onChangeText={onChangeMessage}
            multiline
            style={styles.input}
            placeholder={MATCH_WAVE_DEFAULT_MESSAGE}
            placeholderTextColor={PawColors.textMuted}
            editable={!busy}
          />
          <Pressable
            onPress={onSend}
            disabled={busy || !message.trim()}
            style={[styles.sendBtn, (busy || !message.trim()) && styles.sendBtnDisabled]}>
            <Text style={styles.sendText}>{busy ? 'Sending…' : 'Send wave'}</Text>
          </Pressable>
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
    paddingTop: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  title: {
    fontSize: PawFontSize.body,
    fontWeight: '700',
    color: PawColors.black,
  },
  subtitle: {
    fontSize: PawFontSize.small,
    lineHeight: PawLineHeight.small,
    fontWeight: '300',
    color: PawColors.textMuted,
  },
  input: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusField,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: PawFontSize.body,
    color: PawColors.black,
    backgroundColor: PawColors.fieldWhite,
    textAlignVertical: 'top',
  },
  sendBtn: {
    backgroundColor: PawColors.peachBorder,
    borderWidth: 1,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusPill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendText: {
    fontSize: PawFontSize.body,
    fontWeight: '600',
    color: PawColors.black,
  },
});
