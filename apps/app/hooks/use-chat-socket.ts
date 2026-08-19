import { useCallback, useEffect, useRef, useState } from 'react';

import { getChatRealtimeUrl } from '@/lib/api/chat';
import type { MessageResponse } from '@/lib/api/chat';

export type ChatActivityPayload = {
  kind: 'reaction';
  reactionChange: 'added' | 'removed' | 'changed';
  actorUserId: string;
  actorName: string;
  messageOwnerId: string;
  emoji: string;
};

export type ChatServerEvent =
  | { type: 'connected'; userId: string }
  | { type: 'pong' }
  | { type: 'new_message'; message: MessageResponse }
  | { type: 'message_read'; conversationId: string; readerId: string; marked?: number }
  | { type: 'user_typing'; conversationId: string; userId: string; active: boolean }
  | { type: 'conversation_updated'; conversationId: string }
  | { type: 'message_ack'; message: MessageResponse }
  | {
      type: 'message_updated';
      message: MessageResponse;
      activity?: ChatActivityPayload;
    }
  | { type: 'error'; message: string };

type UseChatSocketOptions = {
  token: string | null;
  conversationId?: string;
  onEvent?: (event: ChatServerEvent) => void;
};

export function useChatSocket({ token, conversationId, onEvent }: UseChatSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const onEventRef = useRef(onEvent);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const send = useCallback((payload: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setConnected(false);
      return;
    }

    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (cancelled) return;
      const ws = new WebSocket(getChatRealtimeUrl(token));
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        setConnected(true);
        if (conversationId) {
          ws.send(JSON.stringify({ type: 'join_conversation', conversationId }));
        }
      };

      ws.onmessage = (ev) => {
        try {
          const parsed = JSON.parse(String(ev.data)) as ChatServerEvent;
          onEventRef.current?.(parsed);
        } catch {
          /* ignore malformed */
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (!cancelled) {
          reconnectTimer = setTimeout(connect, 2500);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
      wsRef.current = null;
      setConnected(false);
    };
  }, [token, conversationId]);

  const joinConversation = useCallback(
    (id: string) => send({ type: 'join_conversation', conversationId: id }),
    [send],
  );

  const leaveConversation = useCallback(
    (id: string) => send({ type: 'leave_conversation', conversationId: id }),
    [send],
  );

  const sendMessage = useCallback(
    (
      conversationId: string,
      content: string,
      clientMessageId?: string,
      replyToMessageId?: string,
    ) =>
      send({
        type: 'send_message',
        conversationId,
        content,
        clientMessageId,
        replyToMessageId,
      }),
    [send],
  );

  const markRead = useCallback(
    (conversationId: string) => send({ type: 'mark_as_read', conversationId }),
    [send],
  );

  const setTyping = useCallback(
    (conversationId: string, active: boolean) =>
      send({
        type: active ? 'typing_start' : 'typing_stop',
        conversationId,
      }),
    [send],
  );

  const toggleReaction = useCallback(
    (messageId: string, emoji: string) =>
      send({
        type: 'toggle_reaction',
        messageId,
        emoji,
      }),
    [send],
  );

  return {
    connected,
    send,
    joinConversation,
    leaveConversation,
    sendMessage,
    markRead,
    setTyping,
    toggleReaction,
  };
}
