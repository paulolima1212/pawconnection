import { apiRequest } from '@/lib/api/client';
import { blockUser as blockUserApi, unblockUser as unblockUserApi } from '@/lib/api/moderation';
import { getApiBaseUrl } from '@/lib/api/config';
import { getPublicProfile } from '@/lib/api/profile';

export type ChatUserSummary = {
  id: string;
  fullName: string;
  handle: string;
  photoUrl: string | null;
  petName: string | null;
  petPhotoUrl: string | null;
};

export type MessageReplyPreview = {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  deleted: boolean;
};

export type MessageReactionSummary = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
  userIds: string[];
};

export type ConversationResponse = {
  id: string;
  participantOneId: string;
  participantTwoId: string;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  isFriend: boolean;
  otherUser: ChatUserSummary;
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  blockedByMe?: boolean;
};

export type MessageResponse = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  status: string;
  clientMessageId: string | null;
  replyToMessageId: string | null;
  replyTo: MessageReplyPreview | null;
  reactions: MessageReactionSummary[];
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  sender: ChatUserSummary;
};

export type MessagesPage = {
  items: MessageResponse[];
  nextCursor: string | null;
};

export function getChatRealtimeUrl(token: string): string {
  const base = getApiBaseUrl().replace(/^http/i, (m) => (m.toLowerCase() === 'https' ? 'wss' : 'ws'));
  return `${base}/realtime/chat?token=${encodeURIComponent(token)}`;
}

export function createConversation(participantUserId: string) {
  return apiRequest<ConversationResponse>('/conversations', {
    method: 'POST',
    body: { participantUserId },
  });
}

export function createConversationByHandle(handle: string) {
  const normalized = handle.replace(/^@/, '');
  return apiRequest<ConversationResponse>('/conversations/by-handle', {
    method: 'POST',
    body: { handle: normalized },
  });
}

/** Prefer user id (`POST /conversations`); falls back to by-handle when needed. */
export async function startConversationWithProfile(profile: {
  id?: string | null;
  handle: string;
}) {
  const normalizedHandle = profile.handle.replace(/^@/, '').trim();
  let userId = profile.id ?? null;
  if (!userId) {
    try {
      const fresh = await getPublicProfile(normalizedHandle);
      userId = fresh.id ?? null;
    } catch {
      /* use by-handle fallback */
    }
  }
  if (userId) {
    return createConversation(userId);
  }
  return createConversationByHandle(normalizedHandle);
}

export function listConversations() {
  return apiRequest<ConversationResponse[]>('/conversations');
}

export function getConversation(conversationId: string) {
  return apiRequest<ConversationResponse>(`/conversations/${conversationId}`);
}

export function listMessages(conversationId: string, params?: { cursor?: string; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.cursor) qs.set('cursor', params.cursor);
  if (params?.limit) qs.set('limit', String(params.limit));
  const suffix = qs.size ? `?${qs.toString()}` : '';
  return apiRequest<MessagesPage>(`/conversations/${conversationId}/messages${suffix}`);
}

export function sendMessage(
  conversationId: string,
  body: { content: string; clientMessageId?: string; replyToMessageId?: string },
) {
  return apiRequest<MessageResponse>(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body,
  });
}

export function toggleMessageReaction(messageId: string, emoji: string) {
  return apiRequest<MessageResponse>(`/messages/${messageId}/reactions`, {
    method: 'POST',
    body: { emoji },
  });
}

export function markConversationRead(conversationId: string) {
  return apiRequest<{ marked: number }>(`/conversations/${conversationId}/read`, {
    method: 'POST',
  });
}

export function blockUser(userId: string) {
  return blockUserApi(userId);
}

export function unblockUser(userId: string) {
  return unblockUserApi(userId);
}
