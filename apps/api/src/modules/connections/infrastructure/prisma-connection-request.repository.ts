import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { mapConnectionRequestToDomain } from '../../../shared/infrastructure/mappers/prisma.mapper';
import { ConflictError, NotFoundError } from '../../../shared/domain/result';
import {
  ConnectionTypeValue,
  ConnectionRequestEntity,
} from '../../../shared/domain/types';
import { IConnectionRequestRepository } from '../domain/repositories/connection-request.repository';

@Injectable()
export class PrismaConnectionRequestRepository
  implements IConnectionRequestRepository
{
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
      data: { status: 'accepted' },
      include: this.include,
    });
    return mapConnectionRequestToDomain(updated);
  }

  async reject(id: string, userId: string): Promise<ConnectionRequestEntity> {
    const request = await this.findById(id);
    if (!request) throw new NotFoundError('Request not found');
    if (request.recipientId !== userId && request.senderId !== userId) {
      throw new ConflictError('Not allowed to reject this request');
    }
    const updated = await this.prisma.connectionRequest.update({
      where: { id },
      data: { status: 'rejected' },
      include: this.include,
    });
    return mapConnectionRequestToDomain(updated);
  }

  async create(
    senderId: string,
    recipientId: string,
    type: ConnectionTypeValue,
  ): Promise<ConnectionRequestEntity> {
    const created = await this.prisma.connectionRequest.create({
      data: { senderId, recipientId, type },
      include: this.include,
    });
    return mapConnectionRequestToDomain(created);
  }
}
