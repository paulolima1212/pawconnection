import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { UserBlock } from '../domain/user-block.entity';
import {
  BlockedUserRow,
  IUserBlockRepository,
} from '../domain/repositories/user-block.repository';

@Injectable()
export class PrismaUserBlockRepository implements IUserBlockRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPair(blockerId: string, blockedId: string): Promise<UserBlock | null> {
    const row = await this.prisma.userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    return row ? this.toDomain(row) : null;
  }

  async save(block: UserBlock): Promise<void> {
    const state = block.toState();
    await this.prisma.userBlock.upsert({
      where: { blockerId_blockedId: { blockerId: state.blockerId, blockedId: state.blockedId } },
      create: {
        id: state.id,
        blockerId: state.blockerId,
        blockedId: state.blockedId,
        createdAt: state.createdAt,
      },
      update: {},
    });
  }

  async delete(blockerId: string, blockedId: string): Promise<boolean> {
    const result = await this.prisma.userBlock.deleteMany({
      where: { blockerId, blockedId },
    });
    return result.count > 0;
  }

  async listBlockedBy(blockerId: string): Promise<BlockedUserRow[]> {
    const rows = await this.prisma.userBlock.findMany({
      where: { blockerId },
      orderBy: { createdAt: 'desc' },
      select: { blockedId: true, createdAt: true },
    });
    return rows;
  }

  private toDomain(row: {
    id: string;
    blockerId: string;
    blockedId: string;
    createdAt: Date;
  }): UserBlock {
    return UserBlock.restore(row);
  }
}
