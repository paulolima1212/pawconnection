import { Inject, Injectable } from '@nestjs/common';
import {
  MessageStatus as PrismaMessageStatus,
  MessageType as PrismaMessageType,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { SupabaseService } from '../../../shared/infrastructure/supabase/supabase.service';
import { mapUserToSummary } from '../../../shared/infrastructure/mappers/prisma.mapper';
import { Conversation } from '../domain/entities/conversation.entity';
import { Message } from '../domain/entities/message.entity';
import { ConversationStatus } from '../domain/conversation-status';
import { MessageStatus } from '../domain/message-status';
import { MessageType } from '../domain/message-type';
import {
  CHAT_CONNECTION_READER,
  IChatConnectionReader,
} from '../domain/ports/connection-reader.port';
import {
  ConversationReadModel,
  IChatRepository,
  MessagePage,
  MessageReactionSummary,
  MessageReadModel,
} from '../domain/repositories/chat.repository';
import { canonicalParticipantPair } from '../domain/participant-pair';

const DEFAULT_MESSAGE_LIMIT = 30;

const messageInclude = {
  sender: { include: { pet: true, interests: true } },
  replyTo: { include: { sender: { include: { pet: true, interests: true } } } },
  reactions: true,
} as const;

type MessageRow = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: PrismaMessageType;
  status: PrismaMessageStatus;
  clientMessageId: string | null;
  replyToMessageId: string | null;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  sender: {
    id: string;
    fullName: string;
    handle: string;
    photoUrl: string | null;
    pet: { name: string; photoUrl: string | null } | null;
  };
  replyTo: {
    id: string;
    senderId: string;
    content: string;
    status: PrismaMessageStatus;
    deletedAt: Date | null;
    sender: {
      id: string;
      fullName: string;
      handle: string;
      photoUrl: string | null;
      pet: { name: string; photoUrl: string | null } | null;
    };
  } | null;
  reactions: { emoji: string; userId: string }[];
};

@Injectable()
export class PrismaChatRepository implements IChatRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    @Inject(CHAT_CONNECTION_READER)
    private readonly connections: IChatConnectionReader,
  ) {}

  private mapConversation(row: {
    id: string;
    participantOneId: string;
    participantTwoId: string;
    status: string;
    lastMessageId: string | null;
    lastMessageAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): Conversation {
    return Conversation.restore({
      id: row.id,
      participantOneId: row.participantOneId,
      participantTwoId: row.participantTwoId,
      status: row.status as ConversationStatus,
      lastMessageId: row.lastMessageId,
      lastMessageAt: row.lastMessageAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private mapMessage(row: {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    type: PrismaMessageType;
    status: PrismaMessageStatus;
    clientMessageId: string | null;
    replyToMessageId?: string | null;
    readAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): Message {
    return Message.restore({
      id: row.id,
      conversationId: row.conversationId,
      senderId: row.senderId,
      content: row.content,
      type: row.type as MessageType,
      status: row.status as MessageStatus,
      clientMessageId: row.clientMessageId,
      replyToMessageId: row.replyToMessageId ?? null,
      readAt: row.readAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  }

  private authorFromUser(user: {
    id: string;
    fullName: string;
    handle: string;
    photoUrl: string | null;
    pet: { name: string; photoUrl: string | null } | null;
  }) {
    const summary = mapUserToSummary({ ...user, interests: [] } as never);
    return {
      id: summary.id,
      fullName: summary.fullName,
      handle: summary.handle,
      photoUrl: this.supabase.normalizePublicUrl(summary.photoUrl),
      petName: summary.petName ?? null,
      petPhotoUrl: this.supabase.normalizePublicUrl(summary.petPhotoUrl),
    };
  }

  private summarizeReactions(
    reactions: { emoji: string; userId: string }[],
    viewerId: string,
  ): MessageReactionSummary[] {
    const grouped = new Map<string, { userIds: string[] }>();
    for (const reaction of reactions) {
      const current = grouped.get(reaction.emoji) ?? { userIds: [] };
      current.userIds.push(reaction.userId);
      grouped.set(reaction.emoji, current);
    }
    return [...grouped.entries()].map(([emoji, stats]) => ({
      emoji,
      count: stats.userIds.length,
      reactedByMe: stats.userIds.includes(viewerId),
      userIds: stats.userIds,
    }));
  }

  private mapRowToReadModel(row: MessageRow, viewerId: string): MessageReadModel {
    const deleted =
      row.status === PrismaMessageStatus.DELETED || row.deletedAt != null;
    return {
      id: row.id,
      conversationId: row.conversationId,
      senderId: row.senderId,
      content: deleted ? '' : row.content,
      type: row.type as MessageType,
      status: row.status,
      clientMessageId: row.clientMessageId,
      replyToMessageId: row.replyToMessageId,
      replyTo: row.replyTo
        ? {
            id: row.replyTo.id,
            senderId: row.replyTo.senderId,
            senderName: row.replyTo.sender.fullName,
            content:
              row.replyTo.status === PrismaMessageStatus.DELETED ||
              row.replyTo.deletedAt
                ? ''
                : row.replyTo.content,
            deleted:
              row.replyTo.status === PrismaMessageStatus.DELETED ||
              Boolean(row.replyTo.deletedAt),
          }
        : null,
      reactions: this.summarizeReactions(row.reactions, viewerId),
      readAt: row.readAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
      sender: this.authorFromUser(row.sender),
    };
  }

  async findConversationByParticipants(
    participantA: string,
    participantB: string,
  ): Promise<Conversation | null> {
    const { participantOneId, participantTwoId } = canonicalParticipantPair(
      participantA,
      participantB,
    );
    const row = await this.prisma.conversation.findUnique({
      where: {
        participantOneId_participantTwoId: { participantOneId, participantTwoId },
      },
    });
    return row ? this.mapConversation(row) : null;
  }

  async findConversationById(id: string): Promise<Conversation | null> {
    const row = await this.prisma.conversation.findUnique({ where: { id } });
    return row ? this.mapConversation(row) : null;
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    const state = conversation.toState();
    await this.prisma.conversation.upsert({
      where: { id: state.id },
      create: {
        id: state.id,
        participantOneId: state.participantOneId,
        participantTwoId: state.participantTwoId,
        status: state.status,
        lastMessageId: state.lastMessageId,
        lastMessageAt: state.lastMessageAt,
        createdAt: state.createdAt,
        updatedAt: state.updatedAt,
      },
      update: {
        status: state.status,
        lastMessageId: state.lastMessageId,
        lastMessageAt: state.lastMessageAt,
        updatedAt: state.updatedAt,
      },
    });
  }

  async listConversationsForUser(
    userId: string,
    limit = 50,
  ): Promise<ConversationReadModel[]> {
    const rows = await this.prisma.conversation.findMany({
      where: {
        OR: [{ participantOneId: userId }, { participantTwoId: userId }],
      },
      orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { include: { pet: true, interests: true } },
          },
        },
      },
    });

    const otherIds = rows.map((c) =>
      c.participantOneId === userId ? c.participantTwoId : c.participantOneId,
    );
    const [others, friendMap] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: otherIds } },
        include: { pet: true, interests: true },
      }),
      this.connections.friendStatusForOthers(userId, otherIds),
    ]);
    const otherMap = new Map(others.map((u) => [u.id, u]));

    const result: ConversationReadModel[] = [];
    for (const row of rows) {
      const otherId =
        row.participantOneId === userId ? row.participantTwoId : row.participantOneId;
      const otherUser = otherMap.get(otherId);
      if (!otherUser) continue;

      const last = row.messages[0];
      const unreadCount = await this.prisma.message.count({
        where: {
          conversationId: row.id,
          senderId: { not: userId },
          readAt: null,
          deletedAt: null,
          status: { not: PrismaMessageStatus.DELETED },
        },
      });

      result.push({
        id: row.id,
        participantOneId: row.participantOneId,
        participantTwoId: row.participantTwoId,
        lastMessageId: row.lastMessageId,
        lastMessageAt: row.lastMessageAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        isFriend: friendMap.get(otherId) ?? false,
        otherUser: this.authorFromUser(otherUser),
        lastMessage: last
          ? {
              id: last.id,
              content: last.status === PrismaMessageStatus.DELETED ? '' : last.content,
              senderId: last.senderId,
              createdAt: last.createdAt,
            }
          : null,
        unreadCount,
      });
    }
    return result;
  }

  async findMessageById(id: string): Promise<Message | null> {
    const row = await this.prisma.message.findUnique({ where: { id } });
    return row ? this.mapMessage(row) : null;
  }

  async findMessageByClientId(
    conversationId: string,
    clientMessageId: string,
  ): Promise<Message | null> {
    const row = await this.prisma.message.findUnique({
      where: {
        conversationId_clientMessageId: { conversationId, clientMessageId },
      },
    });
    return row ? this.mapMessage(row) : null;
  }

  async saveMessage(message: Message): Promise<void> {
    const state = message.toState();
    await this.prisma.message.upsert({
      where: { id: state.id },
      create: {
        id: state.id,
        conversationId: state.conversationId,
        senderId: state.senderId,
        content: state.content,
        type: state.type as PrismaMessageType,
        status: state.status as PrismaMessageStatus,
        clientMessageId: state.clientMessageId,
        replyToMessageId: state.replyToMessageId,
        readAt: state.readAt,
        createdAt: state.createdAt,
        updatedAt: state.updatedAt,
        deletedAt: state.deletedAt,
      },
      update: {
        content: state.content,
        type: state.type as PrismaMessageType,
        status: state.status as PrismaMessageStatus,
        readAt: state.readAt,
        updatedAt: state.updatedAt,
        deletedAt: state.deletedAt,
      },
    });
  }

  async listMessages(
    conversationId: string,
    viewerId: string,
    options?: { cursor?: string | null; limit?: number },
  ): Promise<MessagePage> {
    const limit = Math.min(options?.limit ?? DEFAULT_MESSAGE_LIMIT, 50);
    const cursor = options?.cursor;

    const where: { conversationId: string; OR?: object[] } = { conversationId };
    if (cursor) {
      const cursorMsg = await this.prisma.message.findUnique({
        where: { id: cursor },
        select: { createdAt: true, id: true },
      });
      if (cursorMsg) {
        where.OR = [
          { createdAt: { lt: cursorMsg.createdAt } },
          {
            AND: [{ createdAt: cursorMsg.createdAt }, { id: { lt: cursorMsg.id } }],
          },
        ];
      }
    }

    const rows = await this.prisma.message.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      include: messageInclude,
    });

    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;
    const items = slice
      .map((row) => this.mapRowToReadModel(row as MessageRow, viewerId))
      .reverse();

    return {
      items,
      nextCursor: hasMore ? slice[slice.length - 1]?.id ?? null : null,
    };
  }

  async findMessageReadModelById(
    messageId: string,
    viewerId: string,
  ): Promise<MessageReadModel | null> {
    const row = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: messageInclude,
    });
    return row ? this.mapRowToReadModel(row as MessageRow, viewerId) : null;
  }

  async toggleMessageReaction(
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<MessageReadModel | null> {
    const existing = await this.prisma.messageReaction.findUnique({
      where: { messageId_userId: { messageId, userId } },
    });

    if (existing?.emoji === emoji) {
      await this.prisma.messageReaction.delete({
        where: { messageId_userId: { messageId, userId } },
      });
    } else if (existing) {
      await this.prisma.messageReaction.update({
        where: { messageId_userId: { messageId, userId } },
        data: { emoji, updatedAt: new Date() },
      });
    } else {
      await this.prisma.messageReaction.create({
        data: {
          id: randomUUID(),
          messageId,
          userId,
          emoji,
        },
      });
    }

    return this.findMessageReadModelById(messageId, userId);
  }

  async markMessagesRead(
    conversationId: string,
    readerId: string,
    upTo?: Date,
  ): Promise<string[]> {
    const pending = await this.prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: readerId },
        readAt: null,
        deletedAt: null,
        ...(upTo ? { createdAt: { lte: upTo } } : {}),
      },
      select: { id: true },
    });
    if (pending.length === 0) return [];

    const ids = pending.map((m) => m.id);
    const now = new Date();
    await this.prisma.message.updateMany({
      where: { id: { in: ids } },
      data: { readAt: now, status: PrismaMessageStatus.READ },
    });
    return ids;
  }

  async updateConversationLastMessage(
    conversationId: string,
    messageId: string,
    at: Date,
  ): Promise<void> {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageId: messageId, lastMessageAt: at, updatedAt: at },
    });
  }
}
