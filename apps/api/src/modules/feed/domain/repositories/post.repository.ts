import { CommentEntity, PostEntity } from '../../../../shared/domain/types';
import { FeedScope } from '../specifications/feed-domain';

export const POST_REPOSITORY = Symbol('POST_REPOSITORY');

export interface IPostRepository {
  listPosts(userId: string): Promise<
    (PostEntity & { authorLat?: number | null; authorLng?: number | null })[]
  >;
  findAuthorId(postId: string): Promise<string | null>;
  createPost(
    authorId: string,
    body: string | undefined,
    imageUrls: string[],
  ): Promise<PostEntity>;
  toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likeCount: number }>;
  listComments(postId: string): Promise<CommentEntity[]>;
  addComment(postId: string, authorId: string, body: string): Promise<CommentEntity>;
}

export interface ListFeedQuery {
  radiusKm?: number;
  scope?: FeedScope;
  search?: string;
  city?: string;
}
