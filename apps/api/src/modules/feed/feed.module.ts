import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module';
import { POST_REPOSITORY } from './domain/repositories/post.repository';
import { PrismaPostRepository } from './infrastructure/prisma-post.repository';
import {
  AddPostCommentUseCase,
  CreateFeedPostUseCase,
  ListFeedPostsUseCase,
  ListPostCommentsUseCase,
  TogglePostLikeUseCase,
} from './application/feed.use-cases';
import { FeedController } from './presentation/feed.controller';

@Module({
  imports: [ProfileModule],
  controllers: [FeedController],
  providers: [
    { provide: POST_REPOSITORY, useClass: PrismaPostRepository },
    ListFeedPostsUseCase,
    CreateFeedPostUseCase,
    TogglePostLikeUseCase,
    ListPostCommentsUseCase,
    AddPostCommentUseCase,
  ],
})
export class FeedModule {}
