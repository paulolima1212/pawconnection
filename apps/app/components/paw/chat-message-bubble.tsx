import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { useCallback, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import type { MessageResponse } from '@/lib/api/chat';
import { ownerFirstName } from '@/lib/chat/message-utils';
import { PawColors, PawFontSize } from '@/constants/paw-styles';

const SWIPE_REPLY_THRESHOLD = 56;
const SWIPE_REPLY_MAX = 76;
const SWIPE_SPRING = { damping: 20, stiffness: 260 };

type ChatMessageBubbleProps = {
  message: MessageResponse;
  mine: boolean;
  onLongPress?: () => void;
  onSwipeReply?: () => void;
  /** Overlay preview — no press handler, no reaction chips. */
  preview?: boolean;
};

function SwipeToReplyShell({
  children,
  mine,
  enabled,
  onSwipeReply,
}: {
  children: ReactNode;
  mine: boolean;
  enabled: boolean;
  onSwipeReply?: () => void;
}) {
  const translateX = useSharedValue(0);

  const completeSwipeReply = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSwipeReply?.();
  }, [onSwipeReply]);

  const pan = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX(-14)
    .failOffsetY([-16, 16])
    .onUpdate((event) => {
      translateX.value = Math.max(-SWIPE_REPLY_MAX, Math.min(0, event.translationX));
    })
    .onEnd(() => {
      if (translateX.value <= -SWIPE_REPLY_THRESHOLD) {
        runOnJS(completeSwipeReply)();
      }
      translateX.value = withSpring(0, SWIPE_SPRING);
    })
    .onFinalize(() => {
      translateX.value = withSpring(0, SWIPE_SPRING);
    });

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const replyHintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, -SWIPE_REPLY_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          translateX.value,
          [0, -SWIPE_REPLY_THRESHOLD],
          [0.55, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.swipeRow, mine && styles.swipeRowMine]}>
      <Animated.View style={[styles.replyHint, replyHintStyle]} pointerEvents="none">
        <Feather name="corner-up-left" size={20} color={PawColors.badgeBlue} />
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.swipeBubbleWrap, bubbleStyle]}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

export function ChatMessageBubble({
  message,
  mine,
  onLongPress,
  onSwipeReply,
  preview = false,
}: ChatMessageBubbleProps) {
  if (message.deleted) {
    return (
      <View style={[styles.row, mine && styles.rowMine]}>
        <Text style={styles.deleted}>Message deleted</Text>
      </View>
    );
  }

  const bubbleBody = (
    <>
      {message.replyTo ? (
        <View style={[styles.quote, mine && styles.quoteMine]}>
          <Text style={[styles.quoteAuthor, mine && styles.quoteAuthorMine]}>
            {ownerFirstName(message.replyTo.senderName)}
          </Text>
          <Text style={[styles.quoteText, mine && styles.quoteTextMine]} numberOfLines={3}>
            {message.replyTo.deleted ? 'Message deleted' : message.replyTo.content}
          </Text>
        </View>
      ) : null}
      <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{message.content}</Text>
    </>
  );

  const interactive = !preview && Boolean(onLongPress || onSwipeReply);

  return (
    <View style={[styles.row, mine && styles.rowMine]}>
      {preview ? (
        <View style={[styles.bubble, mine && styles.bubbleMine, styles.bubblePreview]}>
          {bubbleBody}
        </View>
      ) : (
        <SwipeToReplyShell mine={mine} enabled={interactive} onSwipeReply={onSwipeReply}>
          <Pressable
            onLongPress={onLongPress}
            delayLongPress={280}
            style={[styles.bubble, mine && styles.bubbleMine]}>
            {bubbleBody}
          </Pressable>
        </SwipeToReplyShell>
      )}
      {!preview && message.reactions.length > 0 ? (
        <View style={[styles.reactions, mine && styles.reactionsMine]}>
          {message.reactions.map((reaction) => (
            <View
              key={reaction.emoji}
              style={[styles.reactionChip, reaction.reactedByMe && styles.reactionChipMine]}>
              <Text style={styles.reactionChipText}>
                {reaction.emoji}
                {reaction.count > 1 ? ` ${reaction.count}` : ''}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    gap: 4,
  },
  rowMine: {
    alignItems: 'flex-end',
  },
  swipeRow: {
    position: 'relative',
    maxWidth: '82%',
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  swipeRowMine: {
    alignSelf: 'flex-end',
  },
  swipeBubbleWrap: {
    zIndex: 1,
  },
  replyHint: {
    position: 'absolute',
    right: 2,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 28,
    zIndex: 0,
  },
  bubble: {
    maxWidth: '100%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: PawColors.fieldWhite,
    borderWidth: 1,
    borderColor: PawColors.profileHeaderBorder,
    gap: 8,
  },
  bubbleMine: {
    backgroundColor: PawColors.peachBorder,
    borderColor: PawColors.peachBorder,
  },
  bubblePreview: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: PawColors.badgeBlue,
    paddingLeft: 8,
    gap: 2,
  },
  quoteMine: {
    borderLeftColor: PawColors.whiteCard,
  },
  quoteAuthor: {
    fontSize: PawFontSize.caption,
    fontWeight: '700',
    color: PawColors.badgeBlue,
  },
  quoteAuthorMine: {
    color: PawColors.whiteCard,
  },
  quoteText: {
    fontSize: PawFontSize.caption,
    fontWeight: '300',
    color: PawColors.textMuted,
  },
  quoteTextMine: {
    color: 'rgba(255,255,255,0.88)',
  },
  bubbleText: {
    fontSize: PawFontSize.body,
    color: PawColors.black,
  },
  bubbleTextMine: {
    color: PawColors.whiteCard,
  },
  deleted: {
    fontSize: PawFontSize.caption,
    color: PawColors.textMuted,
    fontStyle: 'italic',
  },
  reactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: -10,
    paddingHorizontal: 8,
    zIndex: 1,
  },
  reactionsMine: {
    justifyContent: 'flex-end',
    paddingRight: 12,
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PawColors.whiteCard,
    borderWidth: 1,
    borderColor: PawColors.profileHeaderBorder,
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minHeight: 26,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  reactionChipMine: {
    borderColor: PawColors.peachBorder,
    backgroundColor: PawColors.creamBg,
  },
  reactionChipText: {
    fontSize: 14,
    lineHeight: 18,
    color: PawColors.black,
  },
});
