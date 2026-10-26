import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import {
  mapConnectionRequestToDomain,
  mapUserToSummary,
} from '../../../shared/infrastructure/mappers/prisma.mapper';
import { ConflictError, NotFoundError } from '../../../shared/domain/result';
import {
  ConnectionTypeValue,
  ConnectionRequestEntity,
  RequestStatusValue,
} from '../../../shared/domain/types';
import { canonicalUserPair } from '../domain/friendship-graph';
import {
  FriendListQuery,
  FriendshipPrivacy,
  IConnectionRequestRepository,
} from '../domain/repositories/connection-request.repository';

@Injectable()
export class PrismaConnectionRequestRepository implements IConnectionRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  private include = {
    sender: { include: { pet: true } },
    recipient: { include: { pet: true } },
  } as const;

  async listForUser(userId: string): Promise<ConnectionRequestEntity[]> {
    const requests = await this.prisma.connectionRequest.findMany({
      where: {
        OR: [{ senderId: userId }, { recipientId: userId }],
      },
      include: this.include,
      orderBy: { createdAt: 'desc' },
    });
    return requests.map(mapConnectionRequestToDomain);
  }

  async findBetween(
    userId: string,
    otherUserId: string,
  ): Promise<ConnectionRequestEntity[]> {
    const requests = await this.prisma.connectionRequest.findMany({
      where: {
        OR: [
          { senderId: userId, recipientId: otherUserId },
          { senderId: otherUserId, recipientId: userId },
        ],
      },
      include: this.include,
      orderBy: { createdAt: 'desc' },
    });
    return requests.map(mapConnectionRequestToDomain);
  }

  async findById(id: string): Promise<ConnectionRequestEntity | null> {
    const request = await this.prisma.connectionRequest.findUnique({
      where: { id },
      include: this.include,
    });
    return request ? mapConnectionRequestToDomain(request) : null;
  }

  async accept(id: string, userId: string): Promise<ConnectionRequestEntity> {
    const request = await this.findById(id);
    if (!request) throw new NotFoundError('Request not found');
    if (request.recipientId !== userId) {
      throw new ConflictError('Only the recipient can accept');
    }
    const updated = await this.prisma.connectionRequest.update({
      where: { id },
      data: { status: 'accepted', acceptedAt: new Date() },
      include: this.include,
    });
    return mapConnectionRequestToDomain(updated);
  }

  async reject(id: string, userId: string): Promise<ConnectionRequestEntity> {
    const request = await this.findById(id);
    if (!request) throw new NotFoundError('Request not found');
    if (request.recipientId !== userId) {
      throw new ConflictError('Only the recipient can decline');
    }
    const updated = await this.prisma.connectionRequest.update({
      where: { id },
      data: { status: 'rejected' },
      include: this.include,
    });
    return mapConnectionRequestToDomain(updated);
  }

  async markPending(id: string): Promise<ConnectionRequestEntity> {
    const updated = await this.prisma.connectionRequest.update({
      where: { id },
      data: { status: 'pending', acceptedAt: null },
      include: this.include,
    });
    return mapConnectionRequestToDomain(updated);
  }

  async reopenAs(
    id: string,
    senderId: string,
    recipientId: string,
  ): Promise<ConnectionRequestEntity> {
    const pair = canonicalUserPair(senderId, recipientId);
    const updated = await this.prisma.connectionRequest.update({
      where: { id },
      data: {
        senderId,
        recipientId,
        userLowId: pair.userLowId,
        userHighId: pair.userHighId,
        status: 'pending',
        acceptedAt: null,
      },
      include: this.include,
    });
    return mapConnectionRequestToDomain(updated);
  }

  async create(
    senderId: string,
    recipientId: string,
    type: ConnectionTypeValue,
  ): Promise<ConnectionRequestEntity> {
    const pair = canonicalUserPair(senderId, recipientId);
    const created = await this.prisma.connectionRequest.create({
      data: {
        senderId,
        recipientId,
        userLowId: pair.userLowId,
        userHighId: pair.userHighId,
        type,
      },
      include: this.include,
    });
    return mapConnectionRequestToDomain(created);
  }

  async transition(
    id: string,
    from: RequestStatusValue,
    to: RequestStatusValue,
  ): Promise<ConnectionRequestEntity | null> {
    const updated = await this.prisma.connectionRequest.updateMany({
      where: { id, status: from },
      data: {
        status: to,
        acceptedAt: to === 'accepted' ? new Date() : null,
      },
    });
    if (updated.count !== 1) return null;
    return this.findById(id);
  }

  async listAcceptedFriendIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.connectionRequest.findMany({
      where: {
        status: 'accepted',
        type: 'friendship',
        OR: [{ senderId: userId }, { recipientId: userId }],
      },
      select: { senderId: true, recipientId: true },
    });
    return rows.map((row) =>
      row.senderId === userId ? row.recipientId : row.senderId,
    );
  }

  async listAcceptedEdges(userIds: string[]) {
    if (!userIds.length) return [];
    return this.prisma.connectionRequest.findMany({
      where: {
        status: 'accepted',
        type: 'friendship',
        OR: [{ senderId: { in: userIds } }, { recipientId: { in: userIds } }],
      },
      select: { senderId: true, recipientId: true },
    });
  }

  async listFriendsPage(query: FriendListQuery) {
    const needle = query.q?.trim();
    const person = needle
      ? {
          OR: [
            { fullName: { contains: needle, mode: 'insensitive' as const } },
            {
              pet: { name: { contains: needle, mode: 'insensitive' as const } },
            },
            {
              pet: {
                breed: { contains: needle, mode: 'insensitive' as const },
              },
            },
          ],
        }
      : undefined;
    const cursor = query.cursor
      ? await this.prisma.connectionRequest.findUnique({
          where: { id: query.cursor },
          select: { id: true, updatedAt: true },
        })
      : null;
    const rows = await this.prisma.connectionRequest.findMany({
      where: {
        AND: [
          {
            status: 'accepted',
            type: 'friendship',
            OR: [
              {
                senderId: query.ownerId,
                ...(person ? { recipient: person } : {}),
              },
              {
                recipientId: query.ownerId,
                ...(person ? { sender: person } : {}),
              },
            ],
          },
          cursor
            ? {
                OR: [
                  { updatedAt: { lt: cursor.updatedAt } },
                  { updatedAt: cursor.updatedAt, id: { lt: cursor.id } },
                ],
              }
            : {},
        ],
      },
      include: this.include,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
    });
    const hasMore = rows.length > query.limit;
    return {
      rows: rows.slice(0, query.limit).map(mapConnectionRequestToDomain),
      hasMore,
    };
  }

  async listProfiles(userIds: string[]) {
    if (!userIds.length) return [];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { pet: true },
    });
    return users.map((user) => ({
      ...mapUserToSummary({ ...user, interests: [], photos: [] }),
      latitude: user.latitude,
      longitude: user.longitude,
    }));
  }

  async listRequestPolicies(userIds: string[]) {
    if (!userIds.length) return [];
    return this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, friendRequestPolicy: true },
    });
  }

  async getPrivacy(userId: string): Promise<FriendshipPrivacy | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        friendRequestPolicy: true,
        friendsListVisibility: true,
        defaultPostVisibility: true,
      },
    });
    return user;
  }

  async updatePrivacy(userId: string, patch: Partial<FriendshipPrivacy>) {
    return this.prisma.user.update({
      where: { id: userId },
      data: patch,
      select: {
        friendRequestPolicy: true,
        friendsListVisibility: true,
        defaultPostVisibility: true,
      },
    });
  }

  async deactivateBetween(
    userId: string,
    otherUserId: string,
  ): Promise<number> {
    const pair = canonicalUserPair(userId, otherUserId);
    const updated = await this.prisma.connectionRequest.updateMany({
      where: {
        userLowId: pair.userLowId,
        userHighId: pair.userHighId,
        status: { in: ['pending', 'accepted'] },
      },
      data: { status: 'removed', acceptedAt: null },
    });
    return updated.count;
  }
}
