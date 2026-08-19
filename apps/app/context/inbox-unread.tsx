import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/context/auth';
import { useChatSocket } from '@/hooks/use-chat-socket';
import * as chatApi from '@/lib/api/chat';
import type { ConversationResponse } from '@/lib/api/chat';

type InboxUnreadContextValue = {
  conversations: ConversationResponse[];
  conversationsLoading: boolean;
  totalUnread: number;
  refreshConversations: () => Promise<void>;
  clearConversationUnread: (conversationId: string) => void;
};

const InboxUnreadContext = createContext<InboxUnreadContextValue | null>(null);

export function InboxUnreadProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, token } = useAuth();
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);

  const refreshConversations = useCallback(async () => {
    if (!isAuthenticated) {
      setConversations([]);
      return;
    }
    setConversationsLoading(true);
    try {
      const data = await chatApi.listConversations();
      setConversations(data);
    } catch {
      setConversations([]);
    } finally {
      setConversationsLoading(false);
    }
  }, [isAuthenticated]);

  const clearConversationUnread = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation,
      ),
    );
  }, []);

  useChatSocket({
    token: isAuthenticated ? token : null,
    onEvent: (event) => {
      if (
        event.type === 'new_message' ||
        event.type === 'conversation_updated' ||
        event.type === 'message_updated'
      ) {
        void refreshConversations();
        return;
      }
      if (event.type === 'message_read') {
        clearConversationUnread(event.conversationId);
      }
    },
  });

  useEffect(() => {
    void refreshConversations();
  }, [refreshConversations]);

  const totalUnread = useMemo(
    () => conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0),
    [conversations],
  );

  const value = useMemo(
    () => ({
      conversations,
      conversationsLoading,
      totalUnread,
      refreshConversations,
      clearConversationUnread,
    }),
    [conversations, conversationsLoading, totalUnread, refreshConversations, clearConversationUnread],
  );

  return <InboxUnreadContext.Provider value={value}>{children}</InboxUnreadContext.Provider>;
}

export function useInboxUnread() {
  const ctx = useContext(InboxUnreadContext);
  if (!ctx) {
    throw new Error('useInboxUnread must be used within InboxUnreadProvider');
  }
  return ctx;
}
