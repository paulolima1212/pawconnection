import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { EVENT_BUS, IEventBus } from '../../shared/events/event-bus';
import { ModerationModule } from '../moderation/moderation.module';
import { COMMENT_EVENTS } from './domain/events/comment-events';
import { COMMENT_REPOSITORY } from './domain/repositories/comment.repository';
import { POST_READER } from './domain/ports/post-reader.port';
import { MODERATION_POLICY } from './domain/ports/moderation-policy.port';
import { PrismaCommentRepository } from './infrastructure/prisma-comment.repository';
import { PrismaPostReader } from './infrastructure/prisma-post-reader';
import { DefaultModerationPolicy } from './infrastructure/default-moderation.policy';
import { PostCommentCountHandler } from './infrastructure/handlers/post-comment-count.handler';
import { CommentNotificationHandler } from './infrastructure/handlers/comment-notification.handler';
import { CommentAnalyticsHandler } from './infrastructure/handlers/comment-analytics.handler';
import { CommentModerationHandler } from './infrastructure/handlers/comment-moderation.handler';
import {
  CountPostCommentsUseCase,
  CreateCommentUseCase,
  DeleteCommentUseCase,
  EditCommentUseCase,
  ListCommentRepliesUseCase,
  ListPostCommentsUseCase,
  ReplyToCommentUseCase,
} from './application/comment.use-cases';
import { CommentController } from './presentation/comment.controller';

@Module({
  imports: [
    ModerationModule,
    // Per-module throttler storage; the ThrottlerGuard is applied at the
    // controller level so only comment writes are rate limited.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
  ],
  controllers: [CommentController],
  providers: [
    { provide: COMMENT_REPOSITORY, useClass: PrismaCommentRepository },
    { provide: POST_READER, useClass: PrismaPostReader },
    { provide: MODERATION_POLICY, useClass: DefaultModerationPolicy },
    CreateCommentUseCase,
    ReplyToCommentUseCase,
    EditCommentUseCase,
    DeleteCommentUseCase,
    ListPostCommentsUseCase,
    ListCommentRepliesUseCase,
    CountPostCommentsUseCase,
    PostCommentCountHandler,
    CommentNotificationHandler,
    CommentAnalyticsHandler,
    CommentModerationHandler,
  ],
})
export class CommentsModule implements OnModuleInit {
  constructor(
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
    private readonly countHandler: PostCommentCountHandler,
    private readonly notificationHandler: CommentNotificationHandler,
    private readonly analyticsHandler: CommentAnalyticsHandler,
    private readonly moderationHandler: CommentModerationHandler,
  ) {}

  /** Subscribe handlers to the event bus once the module is initialized. */
  onModuleInit(): void {
    this.bus.subscribe(COMMENT_EVENTS.CREATED, this.countHandler);
    this.bus.subscribe(COMMENT_EVENTS.DELETED, this.countHandler);

    this.bus.subscribe(COMMENT_EVENTS.CREATED, this.notificationHandler);
    this.bus.subscribe(COMMENT_EVENTS.REPLY_CREATED, this.notificationHandler);

    this.bus.subscribe(COMMENT_EVENTS.CREATED, this.moderationHandler);

    // Analytics observes the full event stream.
    for (const eventType of Object.values(COMMENT_EVENTS)) {
      this.bus.subscribe(eventType, this.analyticsHandler);
    }
  }
}
