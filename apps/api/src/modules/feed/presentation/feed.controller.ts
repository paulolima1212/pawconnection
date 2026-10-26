import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/presentation/jwt-auth.guard';
import {
  CurrentUser,
  AuthUserPayload,
} from '../../../shared/presentation/decorators/current-user.decorator';
import { FeedScope } from '../domain/specifications/feed-domain';
import {
  AddPostCommentUseCase,
  CreateFeedPostUseCase,
  DeleteFeedPostUseCase,
  ListFeedPostsUseCase,
  ListFriendsFeedUseCase,
  ListPostCommentsUseCase,
  TogglePostLikeUseCase,
  UpdateFeedPostUseCase,
} from '../application/feed.use-cases';

class CreatePostDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  body?: string;

  @ApiPropertyOptional({ enum: ['public', 'friends', 'private'] })
  @IsOptional()
  @IsIn(['public', 'friends', 'private'])
  visibility?: 'public' | 'friends' | 'private';

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUrl({}, { each: true })
  imageUrls!: string[];
}

class CreateFeedCommentDto {
  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  body!: string;
}

@ApiTags('feed')
@Controller('feed')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FeedController {
  constructor(
    private readonly listPosts: ListFeedPostsUseCase,
    private readonly createPost: CreateFeedPostUseCase,
    private readonly updatePost: UpdateFeedPostUseCase,
    private readonly deletePost: DeleteFeedPostUseCase,
    private readonly toggleLike: TogglePostLikeUseCase,
    private readonly listComments: ListPostCommentsUseCase,
    private readonly addComment: AddPostCommentUseCase,
    private readonly friendsFeed: ListFriendsFeedUseCase,
  ) {}

  @Get('friends')
  friends(
    @CurrentUser() user: AuthUserPayload,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.friendsFeed.execute(
      user.userId,
      cursor,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('posts')
  @ApiQuery({ name: 'radiusKm', required: false, type: Number })
  @ApiQuery({
    name: 'scope',
    required: false,
    enum: ['all', 'friends', 'mine'],
  })
  @ApiQuery({ name: 'q', required: false, description: 'Post body text' })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'author', required: false })
  @ApiQuery({
    name: 'petGender',
    required: false,
    enum: ['Male', 'Female', 'Other'],
  })
  @ApiQuery({ name: 'petAge', required: false, type: Number })
  @ApiQuery({
    name: 'petSize',
    required: false,
    enum: ['small', 'medium', 'large'],
  })
  posts(
    @CurrentUser() user: AuthUserPayload,
    @Query('radiusKm') radiusKm?: string,
    @Query('scope') scope?: FeedScope,
    @Query('q') q?: string,
    @Query('city') city?: string,
    @Query('author') author?: string,
    @Query('petGender') petGender?: string,
    @Query('petAge') petAge?: string,
    @Query('petSize') petSize?: 'small' | 'medium' | 'large',
  ) {
    const parsedAge =
      petAge != null && petAge !== '' ? Number(petAge) : undefined;
    return this.listPosts.execute(user.userId, {
      radiusKm: radiusKm ? Number(radiusKm) : undefined,
      scope,
      q,
      city,
      author,
      petGender,
      petAge:
        parsedAge != null && !Number.isNaN(parsedAge) ? parsedAge : undefined,
      petSize: petSize,
    });
  }

  @Post('posts')
  create(@CurrentUser() user: AuthUserPayload, @Body() dto: CreatePostDto) {
    return this.createPost.execute(
      user.userId,
      dto.body,
      dto.imageUrls,
      dto.visibility,
    );
  }

  @Patch('posts/:id')
  update(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Body() dto: CreatePostDto,
  ) {
    return this.updatePost.execute(id, user.userId, {
      body: dto.body,
      imageUrls: dto.imageUrls,
      visibility: dto.visibility,
    });
  }

  @Delete('posts/:id')
  remove(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.deletePost.execute(id, user.userId);
  }

  @Post('posts/:id/like')
  like(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.toggleLike.execute(id, user.userId);
  }

  @Get('posts/:id/comments')
  comments(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.listComments.execute(id, user.userId);
  }

  @Post('posts/:id/comments')
  comment(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Body() dto: CreateFeedCommentDto,
  ) {
    return this.addComment.execute(id, user.userId, dto.body);
  }
}
