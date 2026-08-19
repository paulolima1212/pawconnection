import { useAuth } from '@/context/auth';
import { usePawTooltip } from '@/context/paw-tooltip';
import { useChatSocket } from '@/hooks/use-chat-socket';
import { getActiveChatConversationId } from '@/lib/chat/active-conversation';
import { chatActivityNotice } from '@/lib/chat/chat-activity';

/** Shows in-app toasts for chat reactions and replies when the user is outside that thread. */
export function ChatActivityListener() {
  const { isAuthenticated, token, userId } = useAuth();
  const { showTooltip } = usePawTooltip();

  useChatSocket({
    token: isAuthenticated ? token : null,
    onEvent: (event) => {
      if (event.type !== 'message_updated' && event.type !== 'new_message') return;

      const conversationId = event.message.conversationId;
      if (getActiveChatConversationId() === conversationId) return;

      const notice = chatActivityNotice(event, userId);
      if (!notice) return;

      showTooltip({
        variant: 'info',
        title: notice.title,
        message: notice.message,
        durationMs: 4500,
      });
    },
  });

  return null;
}
