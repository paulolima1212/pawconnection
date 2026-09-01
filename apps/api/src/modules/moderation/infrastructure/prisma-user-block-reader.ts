import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { IUserBlockReader } from '../domain/ports/user-block-reader.port';

@Injectable()
export class PrismaUserBlockReader implements IUserBlockReader {
  constructor(private readonly prisma: PrismaService) {}

  async isBlockedBetween(userId: string, otherUserId: string): Promise<boolean> {
    if (userId === otherUserId) return false;
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

  async listHiddenUserIds(viewerId: string): Promise<string[]> {
    const rows = await this.prisma.userBlock.findMany({
      where: {
        OR: [{ blockerId: viewerId }, { blockedId: viewerId }],
      },
      select: { blockerId: true, blockedId: true },
    });
    const ids = new Set<string>();
    for (const row of rows) {
      ids.add(row.blockerId === viewerId ? row.blockedId : row.blockerId);
    }
    ids.delete(viewerId);
    return [...ids];
  }
}
