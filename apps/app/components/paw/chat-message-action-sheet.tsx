import Feather from '@expo/vector-icons/Feather';
import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ChatMessageBubble } from '@/components/paw/chat-message-bubble';
import type { MessageResponse } from '@/lib/api/chat';
import { extractSingleEmoji } from '@/lib/chat/reaction-emoji';
import { CHAT_QUICK_REACTIONS } from '@/lib/chat/quick-reactions';
import { PawColors, PawFontSize, PawLayout } from '@/constants/paw-styles';

type ChatMessageActionSheetProps = {
  visible: boolean;
  message: MessageResponse | null;
  mine: boolean;
  onClose: () => void;
  onReact: (emoji: string, message: MessageResponse) => void;
  onReply: () => void;
};

export function ChatMessageActionSheet({
  visible,
  message,
  mine,
  onClose,
  onReact,
  onReply,
}: ChatMessageActionSheetProps) {
  const emojiInputRef = useRef<TextInput | null>(null);
  const [emojiDraft, setEmojiDraft] = useState('');

  useEffect(() => {
    if (!visible) {
      setEmojiDraft('');
    }
  }, [visible]);

  const pickReaction = (emoji: string) => {
    if (!message) return;
    onReact(emoji, message);
    onClose();
  };

  const focusEmojiKeyboard = () => {
    emojiInputRef.current?.focus();
  };

  const handleEmojiChange = (text: string) => {
    setEmojiDraft(text);
    const emoji = extractSingleEmoji(text);
    if (!emoji) return;
    pickReaction(emoji);
    setEmojiDraft('');
  };

  if (!message) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.dim} onPress={onClose} accessibilityLabel="Close message actions" />

        <View style={styles.centerStage} pointerEvents="box-none">
          <View style={[styles.messageStack, mine ? styles.messageStackMine : styles.messageStackOther]}>
            <View style={styles.reactionBar}>
              {CHAT_QUICK_REACTIONS.map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => pickReaction(emoji)}
                  style={({ pressed }) => [styles.reactionBtn, pressed && styles.reactionBtnPressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`React with ${emoji}`}>
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                </Pressable>
              ))}
              <Pressable
                onPress={focusEmojiKeyboard}
                style={({ pressed }) => [styles.moreBtn, pressed && styles.moreBtnPressed]}
                accessibilityRole="button"
                accessibilityLabel="More emojis">
                <Feather name="plus" size={20} color={PawColors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.messagePreview}>
              <ChatMessageBubble message={message} mine={mine} preview />
            </View>

            <View style={styles.contextMenu}>
              <Pressable
                onPress={() => {
                  onReply();
                  onClose();
                }}
                style={({ pressed }) => [styles.contextRow, pressed && styles.contextRowPressed]}
                accessibilityRole="button"
                accessibilityLabel="Reply to message">
                <Feather name="corner-up-left" size={20} color={PawColors.black} />
                <Text style={styles.contextLabel}>Reply</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <TextInput
          ref={emojiInputRef}
          value={emojiDraft}
          onChangeText={handleEmojiChange}
          style={styles.hiddenEmojiInput}
          autoCorrect={false}
          autoCapitalize="none"
          keyboardType="default"
          accessibilityLabel="Emoji reaction input"
        />
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
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  centerStage: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: PawLayout.horizontalPadding,
  },
  messageStack: {
    maxWidth: '100%',
    gap: 10,
  },
  messageStackOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageStackMine: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  reactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PawColors.whiteCard,
    borderRadius: 28,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  reactionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionBtnPressed: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    transform: [{ scale: 1.12 }],
  },
  reactionEmoji: {
    fontSize: 28,
  },
  moreBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.07)',
  },
  moreBtnPressed: {
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  messagePreview: {
    maxWidth: '100%',
    transform: [{ scale: 1.02 }],
  },
  contextMenu: {
    minWidth: 168,
    backgroundColor: PawColors.whiteCard,
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  contextRowPressed: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  contextLabel: {
    fontSize: PawFontSize.body,
    fontWeight: '600',
    color: PawColors.black,
  },
  hiddenEmojiInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
