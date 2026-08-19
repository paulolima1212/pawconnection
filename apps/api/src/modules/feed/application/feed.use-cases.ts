import { Inject, Injectable } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../profile/domain/repositories/user.repository';
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
  ) {}

  async execute(userId: string, query: ListFeedPostsQuery) {
    const me = await this.users.findById(userId);
    let items = (await this.posts.listPosts(userId)) as FeedPostWithAuthorMeta[];

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
  constructor(@Inject(POST_REPOSITORY) private readonly posts: IPostRepository) {}

  execute(postId: string, userId: string) {
    return this.posts.toggleLike(postId, userId);
  }
}

@Injectable()
export class ListPostCommentsUseCase {
  constructor(@Inject(POST_REPOSITORY) private readonly posts: IPostRepository) {}

  execute(postId: string) {
    return this.posts.listComments(postId);
  }
}

@Injectable()
export class AddPostCommentUseCase {
  constructor(@Inject(POST_REPOSITORY) private readonly posts: IPostRepository) {}

  execute(postId: string, authorId: string, body: string) {
    return this.posts.addComment(postId, authorId, body);
  }
}
