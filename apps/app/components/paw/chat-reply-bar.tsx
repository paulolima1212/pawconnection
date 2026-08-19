import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MessageResponse } from '@/lib/api/chat';
import { ownerFirstName } from '@/lib/chat/message-utils';
import { PawColors, PawFontSize } from '@/constants/paw-styles';

type ChatReplyBarProps = {
  target: MessageResponse;
  onCancel: () => void;
};

export function ChatReplyBar({ target, onCancel }: ChatReplyBarProps) {
  const label = ownerFirstName(target.sender.fullName);
  const preview = target.deleted ? 'Message deleted' : target.content.trim() || '…';

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <View style={styles.texts}>
          <Text style={styles.label}>Replying to {label}</Text>
          <Text style={styles.preview} numberOfLines={2}>
            {preview}
          </Text>
        </View>
        <Pressable onPress={onCancel} hitSlop={8} accessibilityRole="button" accessibilityLabel="Cancel reply">
          <Text style={styles.cancel}>×</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: PawColors.peachBorder,
    backgroundColor: PawColors.fieldWhite,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: PawFontSize.caption,
    fontWeight: '700',
    color: PawColors.black,
  },
  preview: {
    fontSize: PawFontSize.caption,
    fontWeight: '300',
    color: PawColors.textMuted,
  },
  cancel: {
    fontSize: 22,
    lineHeight: 22,
    color: PawColors.textMuted,
    paddingHorizontal: 4,
  },
});
