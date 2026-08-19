import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { IChatBlockReader } from '../domain/ports/block-reader.port';

@Injectable()
export class PrismaChatBlockReader implements IChatBlockReader {
  constructor(private readonly prisma: PrismaService) {}

  async isBlockedBetween(userId: string, otherUserId: string): Promise<boolean> {
    const row = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: otherUserId },
          { blockerId: otherUserId, blockedId: userId },
        ],
      },
      select: { id: true },
    });
    return Boolean(row);
  }
}
