import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../auth/presentation/jwt-auth.guard';
import {
  AuthUserPayload,
  CurrentUser,
} from '../../../shared/presentation/decorators/current-user.decorator';
import { CorrelationId } from '../../../shared/observability/correlation-id.decorator';
import {
  CreateOrGetConversationUseCase,
  DeleteMessageUseCase,
  EditMessageUseCase,
  GetConversationUseCase,
  ListConversationsUseCase,
  ListMessagesUseCase,
  MarkConversationReadUseCase,
  SendMessageUseCase,
  ToggleMessageReactionUseCase,
  ChatRequestContext,
} from '../application/chat.use-cases';
import {
  CreateConversationByHandleDto,
  CreateConversationDto,
  ListMessagesQueryDto,
  SendMessageDto,
  ToggleMessageReactionDto,
  UpdateMessageDto,
} from './chat.dto';

function ctx(user: AuthUserPayload, correlationId?: string): ChatRequestContext {
  return { userId: user.userId, correlationId };
}

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ChatController {
  constructor(
    private readonly createConversation: CreateOrGetConversationUseCase,
    private readonly listConversations: ListConversationsUseCase,
    private readonly getConversation: GetConversationUseCase,
    private readonly listMessages: ListMessagesUseCase,
    private readonly sendMessage: SendMessageUseCase,
    private readonly toggleReaction: ToggleMessageReactionUseCase,
    private readonly editMessage: EditMessageUseCase,
    private readonly deleteMessage: DeleteMessageUseCase,
    private readonly markRead: MarkConversationReadUseCase,
  ) {}

  @Post('conversations')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create or return existing private conversation' })
  create(
    @CurrentUser() user: AuthUserPayload,
    @CorrelationId() correlationId: string,
    @Body() dto: CreateConversationDto,
  ) {
    return this.createConversation.execute(
      { participantUserId: dto.participantUserId },
      ctx(user, correlationId),
    );
  }

  @Post('conversations/by-handle')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create conversation using public handle' })
  createByHandle(
    @CurrentUser() user: AuthUserPayload,
    @CorrelationId() correlationId: string,
    @Body() dto: CreateConversationByHandleDto,
  ) {
    return this.createConversation.executeByHandle(
      { handle: dto.handle },
      ctx(user, correlationId),
    );
  }

  @Get('conversations')
  @SkipThrottle()
  @ApiOperation({ summary: 'List conversations for current user' })
  list(@CurrentUser() user: AuthUserPayload, @CorrelationId() correlationId: string) {
    return this.listConversations.execute(ctx(user, correlationId));
  }

  @Get('conversations/:conversationId')
  @SkipThrottle()
  @ApiOperation({ summary: 'Get a single conversation for the current user' })
  getOne(
    @CurrentUser() user: AuthUserPayload,
    @CorrelationId() correlationId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.getConversation.execute(conversationId, ctx(user, correlationId));
  }

  @Get('conversations/:conversationId/messages')
  @SkipThrottle()
  @ApiOperation({ summary: 'List messages (cursor pagination)' })
  messages(
    @CurrentUser() user: AuthUserPayload,
    @CorrelationId() correlationId: string,
    @Param('conversationId') conversationId: string,
    @Query() query: ListMessagesQueryDto,
  ) {
    return this.listMessages.execute(conversationId, ctx(user, correlationId), {
      cursor: query.cursor,
      limit: query.limit,
    });
  }

  @Post('conversations/:conversationId/messages')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @ApiOperation({ summary: 'Send a message (REST fallback)' })
  postMessage(
    @CurrentUser() user: AuthUserPayload,
    @CorrelationId() correlationId: string,
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.sendMessage.execute(
      {
        conversationId,
        content: dto.content,
        type: dto.type,
        clientMessageId: dto.clientMessageId,
        replyToMessageId: dto.replyToMessageId,
      },
      ctx(user, correlationId),
    );
  }

  @Post('messages/:messageId/reactions')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @ApiOperation({ summary: 'Toggle an emoji reaction on a message' })
  react(
    @CurrentUser() user: AuthUserPayload,
    @CorrelationId() correlationId: string,
    @Param('messageId') messageId: string,
    @Body() dto: ToggleMessageReactionDto,
  ) {
    return this.toggleReaction.execute(messageId, dto.emoji, ctx(user, correlationId));
  }

  @Post('conversations/:conversationId/read')
  @SkipThrottle()
  @ApiOperation({ summary: 'Mark conversation messages as read' })
  read(
    @CurrentUser() user: AuthUserPayload,
    @CorrelationId() correlationId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.markRead.execute(conversationId, ctx(user, correlationId));
  }

  @Put('messages/:messageId')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'Edit a message' })
  edit(
    @CurrentUser() user: AuthUserPayload,
    @CorrelationId() correlationId: string,
    @Param('messageId') messageId: string,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.editMessage.execute(messageId, dto.content, ctx(user, correlationId));
  }

  @Delete('messages/:messageId')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'Soft-delete a message' })
  remove(
    @CurrentUser() user: AuthUserPayload,
    @CorrelationId() correlationId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.deleteMessage.execute(messageId, ctx(user, correlationId));
  }
}
