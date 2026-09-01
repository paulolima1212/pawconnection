import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import type { KeyboardEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatHeader } from '@/components/paw/chat-header';
import { ChatMessageActionSheet } from '@/components/paw/chat-message-action-sheet';
import { ChatMessageBubble } from '@/components/paw/chat-message-bubble';
import { ChatReplyBar } from '@/components/paw/chat-reply-bar';
import { BlockUserConfirmSheet } from '@/components/paw/block-user-confirm-sheet';
import { PawColors, PawFontSize, PawLayout } from '@/constants/paw-styles';
import { useAuth } from '@/context/auth';
import { useInboxUnread } from '@/context/inbox-unread';
import * as chatApi from '@/lib/api/chat';
import * as moderationApi from '@/lib/api/moderation';
import type { ConversationResponse, MessageResponse } from '@/lib/api/chat';
import {
  buildOptimisticOutgoingMessage,
  dedupeMessages,
  hydrateAllReplyPreviews,
  mergeAckMessage,
  mergeMessageUpdate,
  normalizeReactionsForViewer,
  toggleReactionLocally,
} from '@/lib/chat/message-utils';
import { setActiveChatConversationId } from '@/lib/chat/active-conversation';
import { tooltipMessageFromError, usePawTooltip } from '@/context/paw-tooltip';
import { ApiError } from '@/lib/api/client';
import { useChatSocket, type ChatServerEvent } from '@/hooks/use-chat-socket';
import { openUserProfile } from '@/lib/navigation/open-user-profile';
import { exitChatRoute, shouldExitChatWithBack, clearChatReturnRoute } from '@/lib/navigation/open-chat';

function makeClientId() {
  return `cm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const COMPOSER_VERTICAL_PAD = 16;
const MESSAGE_GAP = 8;

function useKeyboardMetrics() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: KeyboardEvent) => setKeyboardHeight(e.endCoordinates.height);
    const onHide = () => setKeyboardHeight(0);

    const show = Keyboard.addListener(showEvent, onShow);
    const hide = Keyboard.addListener(hideEvent, onHide);
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return { keyboardHeight, keyboardOpen: keyboardHeight > 0 };
}

function normalizeIncomingMessage(message: MessageResponse, userId: string | null): MessageResponse {
  return {
    ...message,
    reactions: normalizeReactionsForViewer(message.reactions ?? [], userId),
  };
}

export default function ChatScreen() {
  const { conversationId, from } = useLocalSearchParams<{ conversationId: string; from?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, userId } = useAuth();
  const { conversations, clearConversationUnread, refreshConversations } = useInboxUnread();
  const { showTooltip } = usePawTooltip();
  const [conversation, setConversation] = useState<ConversationResponse | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [actionTarget, setActionTarget] = useState<MessageResponse | null>(null);
  const [replyTarget, setReplyTarget] = useState<MessageResponse | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<FlatList<MessageResponse>>(null);
  const composerRef = useRef<TextInput | null>(null);
  const pendingReactionRef = useRef<MessageResponse | null>(null);
  const { keyboardHeight, keyboardOpen } = useKeyboardMetrics();
  const bottomInset = Math.max(12, insets.bottom);

  const cachedConversation = conversations.find((c) => c.id === conversationId) ?? null;
  const otherUser = conversation?.otherUser ?? cachedConversation?.otherUser ?? null;
  const otherName = otherUser?.fullName?.split(/\s+/)[0] || otherUser?.fullName || 'this user';

  const exitChat = useCallback(() => {
    if (shouldExitChatWithBack(from) && router.canGoBack()) {
      clearChatReturnRoute();
      router.back();
      return;
    }
    router.replace(exitChatRoute(from));
  }, [from, router]);

  const confirmBlock = async () => {
    if (!otherUser?.id) return;
    setBlocking(true);
    try {
      await moderationApi.blockUser(otherUser.id);
      setBlockOpen(false);
      showTooltip({
        title: 'User blocked',
        message: `${otherName} can no longer see or interact with you.`,
        variant: 'success',
      });
      exitChat();
    } catch (err) {
      showTooltip({
        title: 'Could not block',
        message: tooltipMessageFromError(err, 'Please try again.'),
        variant: 'error',
      });
    } finally {
      setBlocking(false);
    }
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      exitChat();
      return true;
    });
    return () => sub.remove();
  }, [exitChat]);

  const loadConversation = useCallback(async () => {
    if (!conversationId) return;
    if (cachedConversation) {
      setConversation(cachedConversation);
      return;
    }
    try {
      const data = await chatApi.getConversation(conversationId);
      setConversation(data);
    } catch {
      /* header falls back to generic title */
    }
  }, [conversationId, cachedConversation]);

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const page = await chatApi.listMessages(conversationId, { limit: 50 });
      setMessages(
        hydrateAllReplyPreviews(
          dedupeMessages(
            page.items.map((item) => normalizeIncomingMessage(item, userId)),
          ),
        ),
      );
      await chatApi.markConversationRead(conversationId);
      clearConversationUnread(conversationId);
    } finally {
      setLoading(false);
    }
  }, [conversationId, clearConversationUnread, userId]);

  useEffect(() => {
    void loadConversation();
  }, [loadConversation]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!conversationId) return;
    setActiveChatConversationId(conversationId);
    return () => setActiveChatConversationId(null);
  }, [conversationId]);

  const onSocketEvent = useCallback(
    (event: ChatServerEvent) => {
      if (event.type === 'new_message') {
        const msg = normalizeIncomingMessage(event.message, userId);
        setMessages((prev) => dedupeMessages([...prev, msg]));
      }
      if (event.type === 'message_ack') {
        const msg = normalizeIncomingMessage(event.message, userId);
        setMessages((prev) => mergeAckMessage(prev, msg, userId));
      }
      if (event.type === 'message_updated') {
        pendingReactionRef.current = null;
        const msg = normalizeIncomingMessage(event.message, userId);
        setMessages((prev) => mergeMessageUpdate(prev, msg, userId));
      }
      if (event.type === 'error') {
        if (pendingReactionRef.current) {
          const snapshot = pendingReactionRef.current;
          pendingReactionRef.current = null;
          setMessages((prev) => mergeMessageUpdate(prev, snapshot, userId));
        }
        showTooltip({
          variant: 'error',
          message: tooltipMessageFromError(new Error(event.message), event.message),
        });
      }
      if (event.type === 'user_typing' && event.userId !== userId) {
        setTypingUserId(event.active ? event.userId : null);
      }
    },
    [userId, showTooltip],
  );

  const { connected, sendMessage: wsSend, setTyping, markRead, toggleReaction: wsToggleReaction } = useChatSocket({
    token,
    conversationId,
    onEvent: onSocketEvent,
  });

  useEffect(() => {
    if (connected && conversationId) {
      markRead(conversationId);
      clearConversationUnread(conversationId);
    }
  }, [connected, conversationId, markRead, clearConversationUnread]);

  const onDraftChange = (text: string) => {
    setDraft(text);
    if (!conversationId) return;
    setTyping(conversationId, true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(conversationId, false), 1200);
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !conversationId || sending || !userId) return;
    setSending(true);
    const clientMessageId = makeClientId();
    const replySnapshot = replyTarget;
    const replyToMessageId = replySnapshot?.id;
    setDraft('');
    setReplyTarget(null);
    setTyping(conversationId, false);
    try {
      if (connected) {
        setMessages((prev) =>
          dedupeMessages([
            ...prev,
            normalizeIncomingMessage(
              buildOptimisticOutgoingMessage({
                conversationId,
                senderId: userId,
                content: text,
                clientMessageId,
                replyTarget: replySnapshot,
              }),
              userId,
            ),
          ]),
        );
        wsSend(conversationId, text, clientMessageId, replyToMessageId);
      } else {
        const saved = await chatApi.sendMessage(conversationId, {
          content: text,
          clientMessageId,
          replyToMessageId,
        });
        setMessages((prev) =>
          dedupeMessages([...prev, normalizeIncomingMessage(saved, userId)]),
        );
      }
    } finally {
      setSending(false);
    }
  };

  const handleReact = async (emoji: string, target: MessageResponse) => {
    const snapshot = target;
    pendingReactionRef.current = snapshot;
    setMessages((prev) => toggleReactionLocally(prev, snapshot.id, emoji, userId));
    try {
      if (connected) {
        wsToggleReaction(snapshot.id, emoji);
      } else {
        const updated = await chatApi.toggleMessageReaction(snapshot.id, emoji);
        pendingReactionRef.current = null;
        setMessages((prev) => mergeMessageUpdate(prev, updated, userId));
      }
      void refreshConversations();
    } catch (err) {
      pendingReactionRef.current = null;
      setMessages((prev) => mergeMessageUpdate(prev, snapshot, userId));
      showTooltip({
        variant: 'error',
        message: tooltipMessageFromError(
          err instanceof ApiError ? err : new Error('Could not save your reaction.'),
          'Could not save your reaction.',
        ),
      });
    }
  };

  const scrollToLatest = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const handleSwipeReply = useCallback(
    (message: MessageResponse) => {
      setReplyTarget(message);
      requestAnimationFrame(() => {
        composerRef.current?.focus();
        scrollToLatest();
      });
    },
    [scrollToLatest],
  );

  useEffect(() => {
    if (messages.length > 0) {
      scrollToLatest();
    }
  }, [messages.length, scrollToLatest]);

  const renderItem = ({ item }: { item: MessageResponse }) => {
    const mine = item.senderId === userId;
    return (
      <ChatMessageBubble
        message={item}
        mine={mine}
        onLongPress={() => setActionTarget(item)}
        onSwipeReply={() => handleSwipeReply(item)}
      />
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ChatHeader
        otherUser={otherUser}
        connected={connected}
        onBack={exitChat}
        onPressProfile={
          otherUser?.handle
            ? () => openUserProfile(router, otherUser.handle)
            : undefined
        }
        onPressMore={otherUser ? () => setBlockOpen(true) : undefined}
      />

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={PawColors.peachBorder} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            style={styles.listFlex}
            data={messages}
            keyExtractor={(m, index) => m.id || `message-${index}`}
            renderItem={renderItem}
            ItemSeparatorComponent={MessageSeparator}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onContentSizeChange={scrollToLatest}
          />
        )}

        <View
          style={[
            styles.composerDock,
            Platform.OS === 'android' && keyboardOpen
              ? { marginBottom: keyboardHeight }
              : null,
            !keyboardOpen ? { paddingBottom: bottomInset } : null,
          ]}>
          {typingUserId ? <Text style={styles.typing}>Typing…</Text> : null}
          {replyTarget ? (
            <ChatReplyBar target={replyTarget} onCancel={() => setReplyTarget(null)} />
          ) : null}

          <View style={styles.composerRow}>
            <TextInput
              ref={composerRef}
              style={styles.input}
              value={draft}
              onChangeText={onDraftChange}
              placeholder="Message…"
              placeholderTextColor={PawColors.textMuted}
              multiline
              maxLength={4000}
              onFocus={scrollToLatest}
            />
            <Pressable
              onPress={() => void handleSend()}
              disabled={!draft.trim() || sending}
              style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendBtnDisabled]}>
              <Feather name="send" size={20} color={PawColors.whiteCard} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ChatMessageActionSheet
        visible={actionTarget != null}
        message={actionTarget}
        mine={actionTarget?.senderId === userId}
        onClose={() => setActionTarget(null)}
        onReact={(emoji, message) => void handleReact(emoji, message)}
        onReply={() => {
          if (actionTarget) setReplyTarget(actionTarget);
          setActionTarget(null);
        }}
      />
      <BlockUserConfirmSheet
        visible={blockOpen}
        displayName={otherName}
        blocking={blocking}
        onClose={() => setBlockOpen(false)}
        onConfirm={() => void confirmBlock()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PawColors.creamBg,
    maxWidth: PawLayout.screenMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  body: {
    flex: 1,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listFlex: { flex: 1 },
  list: {
    padding: PawLayout.horizontalPadding,
    flexGrow: 1,
    paddingBottom: 8,
  },
  messageSeparator: {
    height: MESSAGE_GAP,
  },
  composerDock: {
    backgroundColor: PawColors.creamBg,
  },
  typing: {
    paddingHorizontal: PawLayout.horizontalPadding,
    paddingBottom: 6,
    fontSize: PawFontSize.caption,
    color: PawColors.textMuted,
    fontStyle: 'italic',
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: PawLayout.horizontalPadding,
    paddingTop: COMPOSER_VERTICAL_PAD,
    paddingBottom: COMPOSER_VERTICAL_PAD,
    marginBottom: COMPOSER_VERTICAL_PAD,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: PawColors.profileHeaderBorder,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: PawFontSize.body,
    backgroundColor: PawColors.fieldWhite,
    color: PawColors.black,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PawColors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});

function MessageSeparator() {
  return <View style={styles.messageSeparator} />;
}
