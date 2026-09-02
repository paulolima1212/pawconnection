import {
  ConversationReadModel,
  MessageReadModel,
} from '../domain/repositories/chat.repository';

export type ConversationResponseDto = {
  id: string;
  participantOneId: string;
  participantTwoId: string;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  isFriend: boolean;
  otherUser: ConversationReadModel['otherUser'];
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
  } | null;
    unreadCount: number;
  blockedByMe: boolean;
};

export type MessageReplyPreviewDto = {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  deleted: boolean;
};

export type MessageReactionSummaryDto = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
  userIds: string[];
};

export type MessageResponseDto = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  status: string;
  clientMessageId: string | null;
  replyToMessageId: string | null;
  replyTo: MessageReplyPreviewDto | null;
  reactions: MessageReactionSummaryDto[];
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  sender: MessageReadModel['sender'];
};

export function toConversationResponse(
  model: ConversationReadModel,
  blockedByMe = false,
): ConversationResponseDto {
  return {
    id: model.id,
    participantOneId: model.participantOneId,
    participantTwoId: model.participantTwoId,
    lastMessageAt: model.lastMessageAt?.toISOString() ?? null,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
    isFriend: model.isFriend,
    otherUser: model.otherUser,
    lastMessage: model.lastMessage
      ? {
          id: model.lastMessage.id,
          content: model.lastMessage.content,
          senderId: model.lastMessage.senderId,
          createdAt: model.lastMessage.createdAt.toISOString(),
        }
      : null,
    unreadCount: model.unreadCount,
    blockedByMe,
  };
}

export function toMessageResponse(model: MessageReadModel): MessageResponseDto {
  return {
    id: model.id,
    conversationId: model.conversationId,
    senderId: model.senderId,
    content: model.content,
    type: model.type,
    status: model.status,
    clientMessageId: model.clientMessageId,
    replyToMessageId: model.replyToMessageId,
    replyTo: model.replyTo,
    reactions: model.reactions,
    readAt: model.readAt?.toISOString() ?? null,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
    deleted: model.status === 'DELETED' || Boolean(model.deletedAt),
    sender: model.sender,
  };
}
