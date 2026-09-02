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

  async isBlockedBy(blockerId: string, blockedId: string): Promise<boolean> {
    if (blockerId === blockedId) return false;
    const row = await this.prisma.userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
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

  async listBlockedByMe(viewerId: string): Promise<string[]> {
    const rows = await this.prisma.userBlock.findMany({
      where: { blockerId: viewerId },
      select: { blockedId: true },
    });
    return rows.map((row) => row.blockedId);
  }

  async listWhoBlocked(viewerId: string): Promise<string[]> {
    const rows = await this.prisma.userBlock.findMany({
      where: { blockedId: viewerId },
      select: { blockerId: true },
    });
    return rows.map((row) => row.blockerId);
  }
}
