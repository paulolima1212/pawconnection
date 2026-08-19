import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { DiscoverPerson } from '@/constants/discover';
import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';

type DiscoverConnectModalProps = {
  visible: boolean;
  person: DiscoverPerson | null;
  busy?: boolean;
  onClose: () => void;
  onSelect: () => void;
};

export function DiscoverConnectModal({
  visible,
  person,
  busy = false,
  onClose,
  onSelect,
}: DiscoverConnectModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.dim} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: Math.max(16, insets.bottom + 8) }]}>
          <Text style={styles.title}>
            Connect with {person?.ownerName ?? 'this dog owner'}
          </Text>
          <Text style={styles.subtitle}>
            Send a connection request to meet up for walks, playdates, or dog-friendly places.
          </Text>
          <Pressable
            disabled={busy}
            onPress={onSelect}
            style={[styles.row, styles.primaryRow]}>
            <Text style={styles.primaryText}>{busy ? 'Sending…' : 'Send connection request'}</Text>
          </Pressable>
          <Pressable disabled={busy} onPress={onClose} style={styles.row}>
            <Text style={styles.rowText}>Cancel</Text>
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
    paddingHorizontal: 8,
  },
  title: {
    fontSize: PawFontSize.body,
    fontWeight: '700',
    color: PawColors.black,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: PawFontSize.small,
    lineHeight: PawLineHeight.small,
    fontWeight: '300',
    color: PawColors.textMuted,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  row: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  primaryRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PawColors.black,
  },
  primaryText: {
    fontSize: PawFontSize.body,
    lineHeight: PawLineHeight.body,
    fontWeight: '700',
    color: PawColors.black,
  },
  rowText: {
    fontSize: PawFontSize.body,
    lineHeight: PawLineHeight.body,
    fontWeight: '300',
    color: PawColors.black,
  },
});
