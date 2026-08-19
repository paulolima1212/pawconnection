import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { IChatConnectionReader } from '../domain/ports/connection-reader.port';

@Injectable()
export class PrismaChatConnectionReader implements IChatConnectionReader {
  constructor(private readonly prisma: PrismaService) {}

  async isFriend(userId: string, otherUserId: string): Promise<boolean> {
    const map = await this.friendStatusForOthers(userId, [otherUserId]);
    return map.get(otherUserId) ?? false;
  }

  async friendStatusForOthers(
    userId: string,
    otherUserIds: string[],
  ): Promise<Map<string, boolean>> {
    const result = new Map<string, boolean>();
    if (otherUserIds.length === 0) return result;

    const unique = [...new Set(otherUserIds)];
    for (const id of unique) result.set(id, false);

    const accepted = await this.prisma.connectionRequest.findMany({
      where: {
        status: 'accepted',
        OR: unique.flatMap((otherId) => [
          { senderId: userId, recipientId: otherId },
          { senderId: otherId, recipientId: userId },
        ]),
      },
      select: { senderId: true, recipientId: true },
    });

    for (const row of accepted) {
      const otherId = row.senderId === userId ? row.recipientId : row.senderId;
      result.set(otherId, true);
    }

    return result;
  }
}
