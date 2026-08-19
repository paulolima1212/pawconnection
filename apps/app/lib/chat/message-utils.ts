import type { MessageReactionSummary, MessageReplyPreview, MessageResponse } from '@/lib/api/chat';

export function dedupeMessages(items: MessageResponse[]): MessageResponse[] {
  const seen = new Set<string>();
  const out: MessageResponse[] = [];
  for (const m of items) {
    const key = m.id?.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
}

export function normalizeReactionsForViewer(
  reactions: MessageReactionSummary[],
  userId: string | null,
): MessageReactionSummary[] {
  return reactions.map((reaction) => ({
    ...reaction,
    reactedByMe: userId ? reaction.userIds.includes(userId) : reaction.reactedByMe,
  }));
}

export function mergeMessageUpdate(
  messages: MessageResponse[],
  updated: MessageResponse,
  userId: string | null,
): MessageResponse[] {
  const normalized = {
    ...updated,
    reactions: normalizeReactionsForViewer(updated.reactions ?? [], userId),
  };
  const index = messages.findIndex((m) => m.id === normalized.id);
  if (index === -1) return dedupeMessages([...messages, normalized]);
  const next = [...messages];
  next[index] = normalized;
  return next;
}

/** Optimistic reaction toggle before the API responds. */
export function toggleReactionLocally(
  messages: MessageResponse[],
  messageId: string,
  emoji: string,
  userId: string | null,
): MessageResponse[] {
  if (!userId) return messages;

  return messages.map((message) => {
    if (message.id !== messageId) return message;

    const reactions = [...(message.reactions ?? [])];
    const mineIndex = reactions.findIndex((reaction) => reaction.userIds.includes(userId));
    const emojiIndex = reactions.findIndex((reaction) => reaction.emoji === emoji);

    if (mineIndex >= 0) {
      const mine = reactions[mineIndex];
      if (mine.emoji === emoji) {
        const nextUserIds = mine.userIds.filter((id) => id !== userId);
        if (nextUserIds.length === 0) {
          reactions.splice(mineIndex, 1);
        } else {
          reactions[mineIndex] = {
            ...mine,
            count: nextUserIds.length,
            userIds: nextUserIds,
            reactedByMe: false,
          };
        }
      } else {
        const prevUserIds = mine.userIds.filter((id) => id !== userId);
        if (prevUserIds.length === 0) {
          reactions.splice(mineIndex, 1);
        } else {
          reactions[mineIndex] = {
            ...mine,
            count: prevUserIds.length,
            userIds: prevUserIds,
            reactedByMe: false,
          };
        }
        if (emojiIndex >= 0) {
          const target = reactions[emojiIndex];
          reactions[emojiIndex] = {
            ...target,
            count: target.count + 1,
            userIds: [...target.userIds, userId],
            reactedByMe: true,
          };
        } else {
          reactions.push({
            emoji,
            count: 1,
            userIds: [userId],
            reactedByMe: true,
          });
        }
      }
    } else if (emojiIndex >= 0) {
      const target = reactions[emojiIndex];
      reactions[emojiIndex] = {
        ...target,
        count: target.count + 1,
        userIds: [...target.userIds, userId],
        reactedByMe: true,
      };
    } else {
      reactions.push({
        emoji,
        count: 1,
        userIds: [userId],
        reactedByMe: true,
      });
    }

    return { ...message, reactions };
  });
}

export function ownerFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

export function hydrateReplyPreview(
  message: MessageResponse,
  siblings: MessageResponse[],
): MessageResponse {
  if (message.replyTo || !message.replyToMessageId) return message;
  const parent = siblings.find((item) => item.id === message.replyToMessageId);
  if (!parent) return message;
  return { ...message, replyTo: buildReplyPreview(parent) };
}

export function hydrateAllReplyPreviews(messages: MessageResponse[]): MessageResponse[] {
  return messages.map((message) => hydrateReplyPreview(message, messages));
}

export function buildReplyPreview(target: MessageResponse): MessageReplyPreview {
  return {
    id: target.id,
    content: target.deleted ? '' : target.content,
    senderId: target.senderId,
    senderName: target.sender?.fullName?.trim() || 'Unknown',
    deleted: target.deleted,
  };
}

export function mergeAckMessage(
  messages: MessageResponse[],
  ack: MessageResponse,
  userId: string | null,
): MessageResponse[] {
  const normalized = {
    ...ack,
    reactions: normalizeReactionsForViewer(ack.reactions ?? [], userId),
  };
  const withoutPending = ack.clientMessageId
    ? messages.filter((message) => message.clientMessageId !== ack.clientMessageId)
    : messages;
  const hydrated = hydrateReplyPreview(normalized, withoutPending);
  return dedupeMessages([...withoutPending, hydrated]);
}

export function buildOptimisticOutgoingMessage(params: {
  conversationId: string;
  senderId: string;
  content: string;
  clientMessageId: string;
  replyTarget?: MessageResponse | null;
}): MessageResponse {
  const now = new Date().toISOString();
  return {
    id: `pending-${params.clientMessageId}`,
    conversationId: params.conversationId,
    senderId: params.senderId,
    content: params.content,
    type: 'TEXT',
    status: 'SENT',
    clientMessageId: params.clientMessageId,
    replyToMessageId: params.replyTarget?.id ?? null,
    replyTo: params.replyTarget ? buildReplyPreview(params.replyTarget) : null,
    reactions: [],
    readAt: null,
    createdAt: now,
    updatedAt: now,
    deleted: false,
    sender: {
      id: params.senderId,
      fullName: '',
      handle: '',
      photoUrl: null,
      petName: null,
      petPhotoUrl: null,
    },
  };
}
