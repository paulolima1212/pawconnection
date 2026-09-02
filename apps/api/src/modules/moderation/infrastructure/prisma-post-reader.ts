import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import {
  IModerationPostReader,
  ReportedPostSnapshot,
} from '../domain/ports/post-reader.port';

@Injectable()
export class PrismaModerationPostReader implements IModerationPostReader {
  constructor(private readonly prisma: PrismaService) {}

  async getAuthorId(postId: string): Promise<string | null> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    return post?.authorId ?? null;
  }

  async getSnapshot(postId: string): Promise<ReportedPostSnapshot | null> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        body: true,
        authorId: true,
        author: { select: { handle: true, fullName: true } },
        images: { orderBy: { sortOrder: 'asc' }, select: { url: true } },
      },
    });
    if (!post) return null;
    return {
      id: post.id,
      body: post.body,
      imageUrls: post.images.map((image) => image.url),
      authorId: post.authorId,
      authorHandle: post.author.handle,
      authorName: post.author.fullName,
    };
  }
}
