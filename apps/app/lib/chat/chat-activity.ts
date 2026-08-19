import type { ChatServerEvent } from '@/hooks/use-chat-socket';

export type ChatActivityNotice = {
  title: string;
  message: string;
};

export function chatActivityNotice(
  event: ChatServerEvent,
  currentUserId: string | null,
): ChatActivityNotice | null {
  if (!currentUserId) return null;

  if (event.type === 'message_updated' && event.activity) {
    const { activity } = event;
    if (activity.reactionChange === 'removed') return null;
    if (activity.messageOwnerId !== currentUserId) return null;
    if (activity.actorUserId === currentUserId) return null;

    return {
      title: activity.actorName,
      message: `Reacted ${activity.emoji} to your message`,
    };
  }

  if (event.type === 'new_message') {
    const { message } = event;
    if (message.senderId === currentUserId) return null;
    if (!message.replyTo || message.replyTo.senderId !== currentUserId) return null;

    const name = message.sender?.fullName?.trim().split(/\s+/)[0] || 'Someone';
    const preview = message.content.trim().slice(0, 80);
    return {
      title: name,
      message: preview ? `Replied: ${preview}` : 'Replied to your message',
    };
  }

  return null;
}
