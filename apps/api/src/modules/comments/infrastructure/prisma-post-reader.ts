import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { IPostReader } from '../domain/ports/post-reader.port';

@Injectable()
export class PrismaPostReader implements IPostReader {
  constructor(private readonly prisma: PrismaService) {}

  async exists(postId: string): Promise<boolean> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    return post !== null;
  }

  async getAuthorId(postId: string): Promise<string | null> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    return post?.authorId ?? null;
  }
}
