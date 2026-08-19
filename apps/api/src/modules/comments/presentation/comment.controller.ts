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
  CountPostCommentsUseCase,
  CreateCommentUseCase,
  DeleteCommentUseCase,
  EditCommentUseCase,
  ListCommentRepliesUseCase,
  ListPostCommentsUseCase,
  ReplyToCommentUseCase,
  RequestContext,
} from '../application/comment.use-cases';
import {
  CreateCommentDto,
  ListCommentsQueryDto,
  ReplyCommentDto,
  UpdateCommentDto,
} from './comment.dto';

/** Tighter limit for write actions: basic spam / abuse throttling. */
const WRITE_THROTTLE = { default: { limit: 20, ttl: 60_000 } };

@ApiTags('comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class CommentController {
  constructor(
    private readonly createComment: CreateCommentUseCase,
    private readonly replyToComment: ReplyToCommentUseCase,
    private readonly editComment: EditCommentUseCase,
    private readonly deleteComment: DeleteCommentUseCase,
    private readonly listComments: ListPostCommentsUseCase,
    private readonly listReplies: ListCommentRepliesUseCase,
    private readonly countComments: CountPostCommentsUseCase,
  ) {}

  private ctx(user: AuthUserPayload, correlationId: string): RequestContext {
    return { userId: user.userId, correlationId };
  }

  @Post('posts/:postId/comments')
  @UseGuards(ThrottlerGuard)
  @Throttle(WRITE_THROTTLE)
  @ApiOperation({ summary: 'Create a comment on a post' })
  create(
    @CurrentUser() user: AuthUserPayload,
    @CorrelationId() correlationId: string,
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.createComment.execute(
      { postId, content: dto.content },
      this.ctx(user, correlationId),
    );
  }

  @Post('comments/:commentId/replies')
  @UseGuards(ThrottlerGuard)
  @Throttle(WRITE_THROTTLE)
  @ApiOperation({ summary: 'Reply to a comment' })
  reply(
    @CurrentUser() user: AuthUserPayload,
    @CorrelationId() correlationId: string,
    @Param('commentId') commentId: string,
    @Body() dto: ReplyCommentDto,
  ) {
    return this.replyToComment.execute(
      { parentCommentId: commentId, content: dto.content },
      this.ctx(user, correlationId),
    );
  }

  @Put('comments/:commentId')
  @UseGuards(ThrottlerGuard)
  @Throttle(WRITE_THROTTLE)
  @ApiOperation({ summary: 'Edit a comment (author only)' })
  edit(
    @CurrentUser() user: AuthUserPayload,
    @CorrelationId() correlationId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.editComment.execute(
      { commentId, content: dto.content },
      this.ctx(user, correlationId),
    );
  }

  @Delete('comments/:commentId')
  @UseGuards(ThrottlerGuard)
  @Throttle(WRITE_THROTTLE)
  @ApiOperation({ summary: 'Soft-delete a comment (author or moderator)' })
  remove(
    @CurrentUser() user: AuthUserPayload,
    @CorrelationId() correlationId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.deleteComment.execute({ commentId }, this.ctx(user, correlationId));
  }

  @Get('posts/:postId/comments')
  @SkipThrottle()
  @ApiOperation({ summary: 'List a post comment tree (cursor paginated)' })
  list(@Param('postId') postId: string, @Query() query: ListCommentsQueryDto) {
    return this.listComments.execute({
      postId,
      limit: query.limit,
      cursor: query.cursor ?? null,
      order: query.order,
    });
  }

  @Get('posts/:postId/comments/count')
  @SkipThrottle()
  @ApiOperation({ summary: 'Count visible comments on a post' })
  count(@Param('postId') postId: string) {
    return this.countComments.execute(postId);
  }

  @Get('comments/:commentId/replies')
  @SkipThrottle()
  @ApiOperation({ summary: 'List replies of a comment (cursor paginated)' })
  replies(
    @Param('commentId') commentId: string,
    @Query() query: ListCommentsQueryDto,
  ) {
    return this.listReplies.execute({
      commentId,
      limit: query.limit,
      cursor: query.cursor ?? null,
      order: query.order,
    });
  }
}
