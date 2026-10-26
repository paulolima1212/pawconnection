import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module';
import { ModerationModule } from '../moderation/moderation.module';
import { ConnectionsModule } from '../connections/connections.module';
import { POST_REPOSITORY } from './domain/repositories/post.repository';
import { PrismaPostRepository } from './infrastructure/prisma-post.repository';
import {
  AddPostCommentUseCase,
  CreateFeedPostUseCase,
  ListFeedPostsUseCase,
  ListFriendsFeedUseCase,
  ListPostCommentsUseCase,
  TogglePostLikeUseCase,
} from './application/feed.use-cases';
import { FeedController } from './presentation/feed.controller';

@Module({
  imports: [ProfileModule, ModerationModule, ConnectionsModule],
  controllers: [FeedController],
  providers: [
    { provide: POST_REPOSITORY, useClass: PrismaPostRepository },
    ListFeedPostsUseCase,
    CreateFeedPostUseCase,
    TogglePostLikeUseCase,
    ListPostCommentsUseCase,
    AddPostCommentUseCase,
    ListFriendsFeedUseCase,
  ],
})
export class FeedModule {}
