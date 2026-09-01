import { Inject, Injectable } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../profile/domain/repositories/user.repository';
import {
  USER_BLOCK_READER,
  IUserBlockReader,
} from '../../moderation/domain/ports/user-block-reader.port';
import { VisibleAuthorSpec } from '../../moderation/domain/specifications/hidden-user';
import { ForbiddenError, NotFoundError } from '../../../shared/domain/result';
import {
  FeedPostFilters,
  FeedPostWithAuthorMeta,
  FeedScope,
  postMatchesFeedFilters,
  PostScopeSpec,
  PostWithinRadiusSpec,
  PublishedPostsSpec,
} from '../domain/specifications/feed-domain';
import {
  IPostRepository,
  POST_REPOSITORY,
} from '../domain/repositories/post.repository';

export type ListFeedPostsQuery = FeedPostFilters & {
  radiusKm?: number;
  scope?: FeedScope;
};

@Injectable()
export class ListFeedPostsUseCase {
  constructor(
    @Inject(POST_REPOSITORY) private readonly posts: IPostRepository,
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(USER_BLOCK_READER) private readonly blocks: IUserBlockReader,
  ) {}

  async execute(userId: string, query: ListFeedPostsQuery) {
    const me = await this.users.findById(userId);
    let items = (await this.posts.listPosts(userId)) as FeedPostWithAuthorMeta[];

    const hiddenIds = new Set(await this.blocks.listHiddenUserIds(userId));
    const visibleAuthor = new VisibleAuthorSpec(hiddenIds);
    items = items.filter((p) => visibleAuthor.isSatisfiedBy(p));

    const scopeSpec = new PublishedPostsSpec().and(
      new PostScopeSpec(query.scope ?? 'all', userId),
    );
    items = items.filter((p) => scopeSpec.isSatisfiedBy(p));

    const filters: FeedPostFilters = {
      city: query.city,
      author: query.author,
      petGender: query.petGender,
      petAge: query.petAge,
      petSize: query.petSize,
      q: query.q,
    };
    const hasContentFilters = Object.values(filters).some(
      (v) => v !== undefined && v !== '' && !(typeof v === 'number' && Number.isNaN(v)),
    );
    if (hasContentFilters) {
      items = items.filter((p) => postMatchesFeedFilters(p, filters));
    }

    const applyRadius =
      query.radiusKm != null &&
      query.radiusKm > 0 &&
      me?.latitude != null &&
      me.longitude != null;

    if (applyRadius) {
      const radiusSpec = new PostWithinRadiusSpec(
        me.latitude!,
        me.longitude!,
        query.radiusKm!,
      );
      items = items.filter((p) => radiusSpec.isSatisfiedBy(p));
    }

    return items.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }
}

@Injectable()
export class CreateFeedPostUseCase {
  constructor(@Inject(POST_REPOSITORY) private readonly posts: IPostRepository) {}

  execute(authorId: string, body: string | undefined, imageUrls: string[]) {
    return this.posts.createPost(authorId, body, imageUrls);
  }
}

@Injectable()
export class TogglePostLikeUseCase {
  constructor(
    @Inject(POST_REPOSITORY) private readonly posts: IPostRepository,
    @Inject(USER_BLOCK_READER) private readonly blocks: IUserBlockReader,
  ) {}

  async execute(postId: string, userId: string) {
    const authorId = await this.posts.findAuthorId(postId);
    if (!authorId) throw new NotFoundError('Post not found');
    if (await this.blocks.isBlockedBetween(userId, authorId)) {
      throw new ForbiddenError('You cannot interact with this post');
    }
    return this.posts.toggleLike(postId, userId);
  }
}

@Injectable()
export class ListPostCommentsUseCase {
  constructor(
    @Inject(POST_REPOSITORY) private readonly posts: IPostRepository,
    @Inject(USER_BLOCK_READER) private readonly blocks: IUserBlockReader,
  ) {}

  async execute(postId: string, userId: string) {
    const authorId = await this.posts.findAuthorId(postId);
    if (!authorId) throw new NotFoundError('Post not found');
    if (await this.blocks.isBlockedBetween(userId, authorId)) {
      throw new ForbiddenError('You cannot interact with this post');
    }
    const hiddenIds = new Set(await this.blocks.listHiddenUserIds(userId));
    const visibleAuthor = new VisibleAuthorSpec(hiddenIds);
    const comments = await this.posts.listComments(postId);
    return comments.filter((c) => visibleAuthor.isSatisfiedBy(c));
  }
}

@Injectable()
export class AddPostCommentUseCase {
  constructor(
    @Inject(POST_REPOSITORY) private readonly posts: IPostRepository,
    @Inject(USER_BLOCK_READER) private readonly blocks: IUserBlockReader,
  ) {}

  async execute(postId: string, authorId: string, body: string) {
    const postAuthorId = await this.posts.findAuthorId(postId);
    if (!postAuthorId) throw new NotFoundError('Post not found');
    if (await this.blocks.isBlockedBetween(authorId, postAuthorId)) {
      throw new ForbiddenError('You cannot interact with this post');
    }
    return this.posts.addComment(postId, authorId, body);
  }
}
