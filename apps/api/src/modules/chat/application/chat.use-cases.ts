import { Inject, Injectable, Logger } from '@nestjs/common';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../shared/domain/result';
import { EVENT_BUS, IEventBus } from '../../../shared/events/event-bus';
import { EventMetadata } from '../../../shared/events/domain-event';
import { Conversation } from '../domain/entities/conversation.entity';
import { Message } from '../domain/entities/message.entity';
import { MessageReadEvent } from '../domain/events/chat-events';
import { isConversationParticipant, otherParticipantId } from '../domain/participant-pair';
import { CHAT_POLICY, IChatPolicy } from '../domain/ports/chat-policy.port';
import { CHAT_USER_READER, IChatUserReader } from '../domain/ports/user-reader.port';
import { CHAT_BLOCK_READER, IChatBlockReader } from '../domain/ports/block-reader.port';
import {
  CHAT_REPOSITORY,
  IChatRepository,
} from '../domain/repositories/chat.repository';
import { MessageType } from '../domain/message-type';
import { isValidReactionEmoji } from '../domain/chat-reaction-emoji';
import { MessageUpdatedEvent } from '../domain/events/chat-events';
import {
  ConversationResponseDto,
  MessageResponseDto,
  toConversationResponse,
  toMessageResponse,
} from './chat.mapper';

export interface ChatRequestContext {
  userId: string;
  correlationId?: string;
}

function metaOf(ctx: ChatRequestContext): EventMetadata {
  return { correlationId: ctx.correlationId, userId: ctx.userId, source: 'chat' };
}

async function flushEvents(bus: IEventBus, entity: Conversation | Message): Promise<void> {
  const events = entity.pullEvents();
  if (events.length) await bus.publishAll(events);
}

@Injectable()
export class CreateOrGetConversationUseCase {
  constructor(
    @Inject(CHAT_REPOSITORY) private readonly repo: IChatRepository,
    @Inject(CHAT_USER_READER) private readonly users: IChatUserReader,
    @Inject(CHAT_POLICY) private readonly policy: IChatPolicy,
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
  ) {}

  async execute(
    input: { participantUserId: string },
    ctx: ChatRequestContext,
  ): Promise<ConversationResponseDto> {
    await this.policy.canUsersCommunicate(ctx.userId, input.participantUserId);

    const existing = await this.repo.findConversationByParticipants(
      ctx.userId,
      input.participantUserId,
    );
    if (existing) {
      const list = await this.repo.listConversationsForUser(ctx.userId, 100);
      const found = list.find((c) => c.id === existing.id);
      if (found) return toConversationResponse(found);
    }

    const conversation = Conversation.create(
      ctx.userId,
      input.participantUserId,
      metaOf(ctx),
    );
    await this.repo.saveConversation(conversation);
    await flushEvents(this.bus, conversation);

    const list = await this.repo.listConversationsForUser(ctx.userId, 100);
    const created = list.find((c) => c.id === conversation.id);
    if (!created) {
      throw new NotFoundError('Conversation could not be loaded');
    }
    return toConversationResponse(created);
  }

  async executeByHandle(
    input: { handle: string },
    ctx: ChatRequestContext,
  ): Promise<ConversationResponseDto> {
    const user = await this.users.findByHandle(input.handle);
    if (!user) throw new NotFoundError('User not found');
    return this.execute({ participantUserId: user.id }, ctx);
  }
}

@Injectable()
export class ListConversationsUseCase {
  constructor(
    @Inject(CHAT_REPOSITORY) private readonly repo: IChatRepository,
    @Inject(CHAT_BLOCK_READER) private readonly blocks: IChatBlockReader,
  ) {}

  async execute(ctx: ChatRequestContext): Promise<ConversationResponseDto[]> {
    const list = await this.repo.listConversationsForUser(ctx.userId);
    const hidden = new Set(await this.blocks.listHiddenUserIds(ctx.userId));
    return list
      .filter((c) => !hidden.has(c.otherUser.id))
      .map(toConversationResponse);
  }
}

@Injectable()
export class GetConversationUseCase {
  constructor(
    @Inject(CHAT_REPOSITORY) private readonly repo: IChatRepository,
    @Inject(CHAT_BLOCK_READER) private readonly blocks: IChatBlockReader,
  ) {}

  async execute(
    conversationId: string,
    ctx: ChatRequestContext,
  ): Promise<ConversationResponseDto> {
    const list = await this.repo.listConversationsForUser(ctx.userId, 100);
    const found = list.find((c) => c.id === conversationId);
    if (!found) throw new NotFoundError('Conversation not found');
    if (await this.blocks.isBlockedBetween(ctx.userId, found.otherUser.id)) {
      throw new NotFoundError('Conversation not found');
    }
    return toConversationResponse(found);
  }
}

@Injectable()
export class ListMessagesUseCase {
  constructor(@Inject(CHAT_REPOSITORY) private readonly repo: IChatRepository) {}

  async execute(
    conversationId: string,
    ctx: ChatRequestContext,
    options?: { cursor?: string | null; limit?: number },
  ): Promise<{ items: MessageResponseDto[]; nextCursor: string | null }> {
    const conversation = await this.repo.findConversationById(conversationId);
    if (!conversation) throw new NotFoundError('Conversation not found');
    if (!isConversationParticipant(conversation.toState(), ctx.userId)) {
      throw new ForbiddenError('You are not a participant in this conversation');
    }

    const page = await this.repo.listMessages(conversationId, ctx.userId, options);
    return {
      items: page.items.map(toMessageResponse),
      nextCursor: page.nextCursor,
    };
  }
}

@Injectable()
export class SendMessageUseCase {
  private readonly logger = new Logger(SendMessageUseCase.name);

  constructor(
    @Inject(CHAT_REPOSITORY) private readonly repo: IChatRepository,
    @Inject(CHAT_POLICY) private readonly policy: IChatPolicy,
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
  ) {}

  async execute(
    input: {
      conversationId: string;
      content: string;
      type?: MessageType;
      clientMessageId?: string | null;
      replyToMessageId?: string | null;
    },
    ctx: ChatRequestContext,
  ): Promise<MessageResponseDto> {
    const conversation = await this.repo.findConversationById(input.conversationId);
    if (!conversation) throw new NotFoundError('Conversation not found');
    const state = conversation.toState();
    if (!isConversationParticipant(state, ctx.userId)) {
      throw new ForbiddenError('You are not a participant in this conversation');
    }

    const recipientId = otherParticipantId(state, ctx.userId);
    await this.policy.canUsersCommunicate(ctx.userId, recipientId);

    if (input.replyToMessageId) {
      const parent = await this.repo.findMessageById(input.replyToMessageId);
      if (!parent || parent.conversationId !== input.conversationId) {
        throw new ValidationError('Reply target must belong to this conversation');
      }
    }

    if (input.clientMessageId) {
      const dup = await this.repo.findMessageByClientId(
        input.conversationId,
        input.clientMessageId,
      );
      if (dup) {
        const page = await this.repo.listMessages(input.conversationId, ctx.userId, {
          limit: 1,
        });
        const hit = page.items.find((m) => m.id === dup.id);
        if (hit) return toMessageResponse(hit);
      }
    }

    const message = Message.createNew({
      conversationId: input.conversationId,
      senderId: ctx.userId,
      recipientId,
      rawContent: input.content,
      type: input.type ?? MessageType.TEXT,
      clientMessageId: input.clientMessageId,
      replyToMessageId: input.replyToMessageId,
      metadata: metaOf(ctx),
    });

    await this.repo.saveMessage(message);
    await this.repo.updateConversationLastMessage(
      input.conversationId,
      message.id,
      message.createdAt,
    );
    await flushEvents(this.bus, message);

    this.logger.log({
      msg: 'chat.message_sent',
      messageId: message.id,
      conversationId: input.conversationId,
      correlationId: ctx.correlationId,
    });

    const saved = await this.repo.findMessageReadModelById(message.id, ctx.userId);
    if (!saved) throw new NotFoundError('Message could not be loaded');
    return toMessageResponse(saved);
  }
}

@Injectable()
export class ToggleMessageReactionUseCase {
  constructor(
    @Inject(CHAT_REPOSITORY) private readonly repo: IChatRepository,
    @Inject(CHAT_USER_READER) private readonly users: IChatUserReader,
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
  ) {}

  async execute(
    messageId: string,
    emoji: string,
    ctx: ChatRequestContext,
  ): Promise<MessageResponseDto> {
    if (!isValidReactionEmoji(emoji)) {
      throw new ValidationError('Pick a single emoji from your keyboard');
    }

    const message = await this.repo.findMessageById(messageId);
    if (!message) throw new NotFoundError('Message not found');

    const conversation = await this.repo.findConversationById(message.conversationId);
    if (!conversation || !isConversationParticipant(conversation.toState(), ctx.userId)) {
      throw new ForbiddenError('You are not a participant in this conversation');
    }

    const before = await this.repo.findMessageReadModelById(messageId, ctx.userId);
    const priorEmoji = before?.reactions.find((reaction) =>
      reaction.userIds.includes(ctx.userId),
    )?.emoji;

    const updated = await this.repo.toggleMessageReaction(messageId, ctx.userId, emoji);
    if (!updated) throw new NotFoundError('Message could not be loaded');

    let reactionChange: 'added' | 'removed' | 'changed';
    if (!priorEmoji) {
      reactionChange = 'added';
    } else if (priorEmoji === emoji) {
      reactionChange = 'removed';
    } else {
      reactionChange = 'changed';
    }

    const actor = await this.users.findById(ctx.userId);

    await this.bus.publish(
      new MessageUpdatedEvent(
        messageId,
        {
          messageId,
          conversationId: message.conversationId,
          actorUserId: ctx.userId,
          actorName: actor?.fullName ?? 'Someone',
          messageOwnerId: message.senderId,
          emoji,
          reactionChange,
        },
        metaOf(ctx),
      ),
    );

    return toMessageResponse(updated);
  }
}

@Injectable()
export class EditMessageUseCase {
  constructor(
    @Inject(CHAT_REPOSITORY) private readonly repo: IChatRepository,
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
  ) {}

  async execute(
    messageId: string,
    content: string,
    ctx: ChatRequestContext,
  ): Promise<MessageResponseDto> {
    const message = await this.repo.findMessageById(messageId);
    if (!message) throw new NotFoundError('Message not found');

    const conversation = await this.repo.findConversationById(message.conversationId);
    if (!conversation || !isConversationParticipant(conversation.toState(), ctx.userId)) {
      throw new ForbiddenError('You are not a participant in this conversation');
    }

    message.edit(content, ctx.userId, metaOf(ctx));
    await this.repo.saveMessage(message);
    await flushEvents(this.bus, message);

    const page = await this.repo.listMessages(message.conversationId, ctx.userId, { limit: 50 });
    const updated = page.items.find((m) => m.id === messageId);
    if (!updated) throw new NotFoundError('Message could not be loaded');
    return toMessageResponse(updated);
  }
}

@Injectable()
export class DeleteMessageUseCase {
  constructor(
    @Inject(CHAT_REPOSITORY) private readonly repo: IChatRepository,
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
  ) {}

  async execute(messageId: string, ctx: ChatRequestContext): Promise<MessageResponseDto> {
    const message = await this.repo.findMessageById(messageId);
    if (!message) throw new NotFoundError('Message not found');

    const conversation = await this.repo.findConversationById(message.conversationId);
    if (!conversation || !isConversationParticipant(conversation.toState(), ctx.userId)) {
      throw new ForbiddenError('You are not a participant in this conversation');
    }

    message.softDelete(ctx.userId, metaOf(ctx));
    await this.repo.saveMessage(message);
    await flushEvents(this.bus, message);

    const page = await this.repo.listMessages(message.conversationId, ctx.userId, { limit: 50 });
    const updated = page.items.find((m) => m.id === messageId);
    if (!updated) throw new NotFoundError('Message could not be loaded');
    return toMessageResponse(updated);
  }
}

@Injectable()
export class MarkConversationReadUseCase {
  constructor(
    @Inject(CHAT_REPOSITORY) private readonly repo: IChatRepository,
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
  ) {}

  async execute(conversationId: string, ctx: ChatRequestContext): Promise<{ marked: number }> {
    const conversation = await this.repo.findConversationById(conversationId);
    if (!conversation) throw new NotFoundError('Conversation not found');
    if (!isConversationParticipant(conversation.toState(), ctx.userId)) {
      throw new ForbiddenError('You are not a participant in this conversation');
    }

    const ids = await this.repo.markMessagesRead(conversationId, ctx.userId);
    if (ids.length) {
      await this.bus.publish(
        new MessageReadEvent(
          conversationId,
          { conversationId, readerId: ctx.userId, messageIds: ids },
          metaOf(ctx),
        ),
      );
    }
    return { marked: ids.length };
  }
}
