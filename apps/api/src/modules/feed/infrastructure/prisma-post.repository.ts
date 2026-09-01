import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { SupabaseService } from '../../../shared/infrastructure/supabase/supabase.service';
import { mapUserToSummary } from '../../../shared/infrastructure/mappers/prisma.mapper';
import { NotFoundError } from '../../../shared/domain/result';
import { CommentEntity, PostEntity } from '../../../shared/domain/types';
import { IPostRepository } from '../domain/repositories/post.repository';

@Injectable()
export class PrismaPostRepository implements IPostRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  private mapPost(
    post: {
      id: string;
      authorId: string;
      body: string | null;
      createdAt: Date;
      updatedAt: Date;
      images: { url: string; sortOrder: number }[];
      likes: { userId: string }[];
      comments: { id: string }[];
      author: {
        id: string;
        fullName: string;
        handle: string;
        photoUrl: string | null;
        latitude: number | null;
        longitude: number | null;
        location: string | null;
        pet: { name: string; photoUrl: string | null } | null;
      };
    },
    currentUserId: string,
  ): PostEntity & { authorLat?: number | null; authorLng?: number | null } {
    const author = mapUserToSummary({
      ...post.author,
      interests: [],
    } as never);

    return {
      id: post.id,
      authorId: post.authorId,
      body: post.body,
      imageUrls: post.images
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((i) => this.supabase.normalizePublicUrl(i.url) ?? i.url),
      likeCount: post.likes.length,
      commentCount: post.comments.length,
      likedByMe: post.likes.some((l) => l.userId === currentUserId),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        ...author,
        photoUrl: this.supabase.normalizePublicUrl(author.photoUrl),
        petPhotoUrl: this.supabase.normalizePublicUrl(author.petPhotoUrl),
      },
      authorLat: post.author.latitude,
      authorLng: post.author.longitude,
    };
  }

  async listPosts(userId: string) {
    const posts = await this.prisma.post.findMany({
      include: {
        images: true,
        likes: true,
        comments: { select: { id: true } },
        author: { include: { pet: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return posts.map((p) => this.mapPost(p, userId));
  }

  async findAuthorId(postId: string): Promise<string | null> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    return post?.authorId ?? null;
  }

  async createPost(
    authorId: string,
    body: string | undefined,
    imageUrls: string[],
  ): Promise<PostEntity> {
    const post = await this.prisma.post.create({
      data: {
        authorId,
        body,
        images: {
          create: imageUrls.slice(0, 8).map((url, index) => ({
            url,
            sortOrder: index,
          })),
        },
      },
      include: {
        images: true,
        likes: true,
        comments: { select: { id: true } },
        author: { include: { pet: true } },
      },
    });
    return this.mapPost(post, authorId);
  }

  async toggleLike(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundError('Post not found');

    const existing = await this.prisma.postLike.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await this.prisma.postLike.delete({
        where: { userId_postId: { userId, postId } },
      });
    } else {
      await this.prisma.postLike.create({ data: { userId, postId } });
    }

    const likeCount = await this.prisma.postLike.count({ where: { postId } });
    return { liked: !existing, likeCount };
  }

  async listComments(postId: string): Promise<CommentEntity[]> {
    const comments = await this.prisma.comment.findMany({
      where: { postId, status: { in: ['ACTIVE', 'EDITED'] } },
      include: { author: { include: { pet: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return comments.map((c) => ({
      id: c.id,
      postId: c.postId,
      authorId: c.authorId,
      body: c.content,
      createdAt: c.createdAt,
      author: mapUserToSummary({ ...c.author, interests: [] } as never),
    }));
  }

  async addComment(
    postId: string,
    authorId: string,
    body: string,
  ): Promise<CommentEntity> {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundError('Post not found');

    const comment = await this.prisma.comment.create({
      data: { postId, authorId, content: body },
      include: { author: { include: { pet: true } } },
    });
    return {
      id: comment.id,
      postId: comment.postId,
      authorId: comment.authorId,
      body: comment.content,
      createdAt: comment.createdAt,
      author: mapUserToSummary({ ...comment.author, interests: [] } as never),
    };
  }
}
