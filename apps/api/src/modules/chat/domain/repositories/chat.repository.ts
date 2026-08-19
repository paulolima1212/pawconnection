import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { MessageType } from '../message-type';

export const CHAT_REPOSITORY = Symbol('CHAT_REPOSITORY');

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

export type ConversationReadModel = {
  id: string;
  participantOneId: string;
  participantTwoId: string;
  lastMessageId: string | null;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isFriend: boolean;
  otherUser: {
    id: string;
    fullName: string;
    handle: string;
    photoUrl: string | null;
    petName: string | null;
    petPhotoUrl: string | null;
  };
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
  } | null;
  unreadCount: number;
};

export type MessageReadModel = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  status: string;
  clientMessageId: string | null;
  replyToMessageId: string | null;
  replyTo: MessageReplyPreview | null;
  reactions: MessageReactionSummary[];
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  sender: {
    id: string;
    fullName: string;
    handle: string;
    photoUrl: string | null;
    petName: string | null;
    petPhotoUrl: string | null;
  };
};

export type MessagePage = {
  items: MessageReadModel[];
  nextCursor: string | null;
};

export interface IChatRepository {
  findConversationByParticipants(
    participantOneId: string,
    participantTwoId: string,
  ): Promise<Conversation | null>;
  findConversationById(id: string): Promise<Conversation | null>;
  saveConversation(conversation: Conversation): Promise<void>;
  listConversationsForUser(userId: string, limit?: number): Promise<ConversationReadModel[]>;

  findMessageById(id: string): Promise<Message | null>;
  findMessageByClientId(
    conversationId: string,
    clientMessageId: string,
  ): Promise<Message | null>;
  saveMessage(message: Message): Promise<void>;
  listMessages(
    conversationId: string,
    viewerId: string,
    options?: { cursor?: string | null; limit?: number },
  ): Promise<MessagePage>;
  markMessagesRead(
    conversationId: string,
    readerId: string,
    upTo?: Date,
  ): Promise<string[]>;
  updateConversationLastMessage(
    conversationId: string,
    messageId: string,
    at: Date,
  ): Promise<void>;
  findMessageReadModelById(messageId: string, viewerId: string): Promise<MessageReadModel | null>;
  toggleMessageReaction(
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<MessageReadModel | null>;
}
