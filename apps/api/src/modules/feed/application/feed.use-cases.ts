import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../profile/domain/repositories/user.repository';
import {
  USER_BLOCK_READER,
  IUserBlockReader,
} from '../../moderation/domain/ports/user-block-reader.port';
import {
  IPostReportReader,
  POST_REPORT_READER,
} from '../../moderation/domain/ports/post-report-reader.port';
import { VisibleAuthorSpec } from '../../moderation/domain/specifications/hidden-user';
import { ForbiddenError, NotFoundError } from '../../../shared/domain/result';
import { FeedPost, FeedPostEdit } from '../domain/feed-post';
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
import {
  CONNECTION_REQUEST_REPOSITORY,
  IConnectionRequestRepository,
} from '../../connections/domain/repositories/connection-request.repository';
import { canViewPost } from '../../connections/domain/friendship-graph';
import { PostVisibilityValue } from '../../../shared/domain/types';

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
    @Inject(POST_REPORT_READER) private readonly reports: IPostReportReader,
    @Inject(CONNECTION_REQUEST_REPOSITORY)
    private readonly friendships: IConnectionRequestRepository,
  ) {}

  async execute(userId: string, query: ListFeedPostsQuery) {
    const me = await this.users.findById(userId);
    let items = (await this.posts.listPosts(
      userId,
    )) as FeedPostWithAuthorMeta[];

    const hiddenIds = new Set(await this.blocks.listHiddenUserIds(userId));
    const visibleAuthor = new VisibleAuthorSpec(hiddenIds);
    items = items.filter((p) => visibleAuthor.isSatisfiedBy(p));

    const reportedIds = new Set(
      await this.reports.listHiddenPostIdsForViewer(userId),
    );
    if (reportedIds.size) {
      items = items.filter((p) => !reportedIds.has(p.id));
    }

    const friendIds = new Set(
      await this.friendships.listAcceptedFriendIds(userId),
    );
    const scopeSpec = new PublishedPostsSpec().and(
      new PostScopeSpec(query.scope ?? 'all', userId, friendIds),
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
      (v) =>
        v !== undefined &&
        v !== '' &&
        !(typeof v === 'number' && Number.isNaN(v)),
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

    return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

@Injectable()
export class CreateFeedPostUseCase {
  constructor(
    @Inject(POST_REPOSITORY) private readonly posts: IPostRepository,
    @Inject(CONNECTION_REQUEST_REPOSITORY)
    private readonly friendships: IConnectionRequestRepository,
  ) {}

  async execute(
    authorId: string,
    body: string | undefined,
    imageUrls: string[],
    visibility?: PostVisibilityValue,
  ) {
    const privacy = await this.friendships.getPrivacy(authorId);
    return this.posts.createPost(
      authorId,
      body,
      imageUrls,
      visibility ?? privacy?.defaultPostVisibility ?? 'public',
    );
  }
}

@Injectable()
export class UpdateFeedPostUseCase {
  private readonly logger = new Logger(UpdateFeedPostUseCase.name);

  constructor(
    @Inject(POST_REPOSITORY) private readonly posts: IPostRepository,
  ) {}

  async execute(postId: string, actorId: string, change: FeedPostEdit) {
    const snapshot = await this.posts.findSnapshot(postId);
    if (!snapshot) throw new NotFoundError('Post not found');

    const next = FeedPost.restore(snapshot).edit(actorId, change);
    const updated = await this.posts.updatePost(next, actorId);

    this.logger.log({
      msg: 'feed.post_edited',
      postId,
      authorId: actorId,
    });

    return updated;
  }
}

@Injectable()
export class DeleteFeedPostUseCase {
  private readonly logger = new Logger(DeleteFeedPostUseCase.name);

  constructor(
    @Inject(POST_REPOSITORY) private readonly posts: IPostRepository,
  ) {}

  async execute(postId: string, actorId: string) {
    const snapshot = await this.posts.findSnapshot(postId);
    if (!snapshot) throw new NotFoundError('Post not found');

    FeedPost.restore(snapshot).assertDeletableBy(actorId);
    await this.posts.deletePost(postId);

    this.logger.log({
      msg: 'feed.post_deleted',
      postId,
      authorId: actorId,
    });

    return { id: postId };
  }
}

async function assertPostVisible(
  posts: IPostRepository,
  friendships: IConnectionRequestRepository,
  blocks: IUserBlockReader,
  postId: string,
  viewerId: string,
) {
  const access = await posts.findAccess(postId);
  if (!access) throw new NotFoundError('Post not found');
  const blocked = await blocks.isBlockedBetween(viewerId, access.authorId);
  const friendIds = await friendships.listAcceptedFriendIds(viewerId);
  if (
    !canViewPost({
      visibility: access.visibility ?? 'public',
      viewerId,
      authorId: access.authorId,
      viewerIsFriend: friendIds.includes(access.authorId),
      blocked,
    })
  ) {
    throw new ForbiddenError('You cannot view this post');
  }
  return access;
}

@Injectable()
export class TogglePostLikeUseCase {
  constructor(
    @Inject(POST_REPOSITORY) private readonly posts: IPostRepository,
    @Inject(USER_BLOCK_READER) private readonly blocks: IUserBlockReader,
    @Inject(CONNECTION_REQUEST_REPOSITORY)
    private readonly friendships: IConnectionRequestRepository,
  ) {}

  async execute(postId: string, userId: string) {
    await assertPostVisible(
      this.posts,
      this.friendships,
      this.blocks,
      postId,
      userId,
    );
    return this.posts.toggleLike(postId, userId);
  }
}

@Injectable()
export class ListPostCommentsUseCase {
  constructor(
    @Inject(POST_REPOSITORY) private readonly posts: IPostRepository,
    @Inject(USER_BLOCK_READER) private readonly blocks: IUserBlockReader,
    @Inject(CONNECTION_REQUEST_REPOSITORY)
    private readonly friendships: IConnectionRequestRepository,
  ) {}

  async execute(postId: string, userId: string) {
    await assertPostVisible(
      this.posts,
      this.friendships,
      this.blocks,
      postId,
      userId,
    );
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
    @Inject(CONNECTION_REQUEST_REPOSITORY)
    private readonly friendships: IConnectionRequestRepository,
  ) {}

  async execute(postId: string, authorId: string, body: string) {
    await assertPostVisible(
      this.posts,
      this.friendships,
      this.blocks,
      postId,
      authorId,
    );
    return this.posts.addComment(postId, authorId, body);
  }
}

@Injectable()
export class ListFriendsFeedUseCase {
  constructor(
    @Inject(POST_REPOSITORY) private readonly posts: IPostRepository,
    @Inject(USER_BLOCK_READER) private readonly blocks: IUserBlockReader,
    @Inject(POST_REPORT_READER) private readonly reports: IPostReportReader,
    @Inject(CONNECTION_REQUEST_REPOSITORY)
    private readonly friendships: IConnectionRequestRepository,
  ) {}

  async execute(userId: string, cursor?: string | null, limit?: number) {
    const pageSize = Math.min(Math.max(limit ?? 20, 1), 50);
    const friendIds = await this.friendships.listAcceptedFriendIds(userId);
    const page = await this.posts.listFriendsFeed(
      userId,
      friendIds,
      cursor ?? null,
      pageSize,
    );
    const hidden = new Set(await this.blocks.listHiddenUserIds(userId));
    const reported = new Set(
      await this.reports.listHiddenPostIdsForViewer(userId),
    );
    const items = page.items.filter(
      (post) => !hidden.has(post.authorId) && !reported.has(post.id),
    );
    const last = items[items.length - 1];
    return {
      items,
      nextCursor: page.hasMore && last ? last.id : null,
      hasMore: page.hasMore,
    };
  }
}
