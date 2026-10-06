import {
  CommentEntity,
  PostEntity,
  PostVisibilityValue,
} from '../../../../shared/domain/types';

export type PostAccess = {
  authorId: string;
  visibility: PostVisibilityValue;
};
import { FeedScope } from '../specifications/feed-domain';

export const POST_REPOSITORY = Symbol('POST_REPOSITORY');

export interface IPostRepository {
  listPosts(
    userId: string,
  ): Promise<
    (PostEntity & { authorLat?: number | null; authorLng?: number | null })[]
  >;
  findAuthorId(postId: string): Promise<string | null>;
  findAccess(postId: string): Promise<PostAccess | null>;
  createPost(
    authorId: string,
    body: string | undefined,
    imageUrls: string[],
    visibility?: PostVisibilityValue,
  ): Promise<PostEntity>;
  listFriendsFeed(
    userId: string,
    friendIds: string[],
    cursor: string | null,
    limit: number,
  ): Promise<{ items: PostEntity[]; hasMore: boolean }>;
  toggleLike(
    postId: string,
    userId: string,
  ): Promise<{ liked: boolean; likeCount: number }>;
  listComments(postId: string): Promise<CommentEntity[]>;
  addComment(
    postId: string,
    authorId: string,
    body: string,
  ): Promise<CommentEntity>;
}

export interface ListFeedQuery {
  radiusKm?: number;
  scope?: FeedScope;
  search?: string;
  city?: string;
}
