import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { IModerationPostReader } from '../domain/ports/post-reader.port';

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
}
