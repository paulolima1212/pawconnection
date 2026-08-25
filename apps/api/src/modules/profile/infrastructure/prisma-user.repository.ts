import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import {
  mapConnectionIntentToPrisma,
  mapGenderToPrisma,
  mapInterestToPrisma,
  mapUserToDomain,
} from '../../../shared/infrastructure/mappers/prisma.mapper';
import { AppConnectionIntent, AppGender, AppInterest, UserEntity } from '../../../shared/domain/types';
import { Handle } from '../domain/value-objects/handle.vo';
import {
  CreateUserInput,
  IUserRepository,
} from '../domain/repositories/user.repository';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private include = {
    interests: true,
    connectionIntents: true,
    photos: { orderBy: { sortOrder: 'asc' as const }, take: 6 },
    pet: {
      include: {
        photos: { orderBy: { sortOrder: 'asc' as const }, take: 6 },
      },
    },
  } as const;

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: this.include,
    });
    return user ? mapUserToDomain(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: this.include,
    });
    return user ? mapUserToDomain(user) : null;
  }

  async findByHandle(handle: string): Promise<UserEntity | null> {
    const normalized = Handle.fromString(handle).value;
    const user = await this.prisma.user.findUnique({
      where: { handle: normalized },
      include: this.include,
    });
    return user ? mapUserToDomain(user) : null;
  }

  async create(input: CreateUserInput): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        fullName: input.fullName,
        handle: input.handle,
      },
      include: this.include,
    });
    return mapUserToDomain(user);
  }

  async updateOwner(
    userId: string,
    data: Parameters<IUserRepository['updateOwner']>[1],
  ): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        gender: data.gender ? mapGenderToPrisma(data.gender as AppGender) : undefined,
        handle: data.handle
          ? Handle.fromString(data.handle).value
          : undefined,
      },
      include: this.include,
    });
    return mapUserToDomain(user);
  }

  async setInterests(userId: string, interests: string[]): Promise<UserEntity> {
    const mapped = interests.map((i) =>
      mapInterestToPrisma(i as AppInterest),
    );
    await this.prisma.userInterest.deleteMany({ where: { userId } });
    if (mapped.length > 0) {
      await this.prisma.userInterest.createMany({
        data: mapped.map((interest) => ({ userId, interest })),
      });
    }
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: this.include,
    });
    return mapUserToDomain(user);
  }

  async setLookingFor(userId: string, lookingFor: string[]): Promise<UserEntity> {
    const mapped = lookingFor.map((value) =>
      mapConnectionIntentToPrisma(value as AppConnectionIntent),
    );
    await this.prisma.userConnectionIntent.deleteMany({ where: { userId } });
    if (mapped.length > 0) {
      await this.prisma.userConnectionIntent.createMany({
        data: mapped.map((intent) => ({ userId, intent })),
      });
    }
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: this.include,
    });
    return mapUserToDomain(user);
  }

  async completeOnboarding(userId: string): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingComplete: true },
      include: this.include,
    });
    return mapUserToDomain(user);
  }

  async listCandidates(
    userId: string,
    options?: { excludeIds?: string[] },
  ): Promise<UserEntity[]> {
    const exclude = new Set([userId, ...(options?.excludeIds ?? [])]);
    const users = await this.prisma.user.findMany({
      where: {
        id: { notIn: [...exclude] },
        onboardingComplete: true,
        pet: { isNot: null },
      },
      include: this.include,
      take: 50,
    });
    return users.map(mapUserToDomain);
  }

  async deleteById(userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const conversations = await tx.conversation.findMany({
        where: {
          OR: [{ participantOneId: userId }, { participantTwoId: userId }],
        },
        select: { id: true },
      });
      const conversationIds = conversations.map((row) => row.id);

      if (conversationIds.length > 0) {
        await tx.messageReaction.deleteMany({
          where: { message: { conversationId: { in: conversationIds } } },
        });
        await tx.message.deleteMany({
          where: { conversationId: { in: conversationIds } },
        });
        await tx.conversation.deleteMany({
          where: { id: { in: conversationIds } },
        });
      }

      await tx.messageReaction.deleteMany({ where: { userId } });
      await tx.message.deleteMany({ where: { senderId: userId } });

      const posts = await tx.post.findMany({
        where: { authorId: userId },
        select: { id: true },
      });
      const postIds = posts.map((row) => row.id);
      if (postIds.length > 0) {
        for (let depth = 0; depth < 16; depth += 1) {
          const nested = await tx.comment.deleteMany({
            where: { postId: { in: postIds }, parentCommentId: { not: null } },
          });
          if (nested.count === 0) break;
        }
        await tx.comment.deleteMany({ where: { postId: { in: postIds } } });
      }
      for (let depth = 0; depth < 16; depth += 1) {
        const nested = await tx.comment.deleteMany({
          where: { authorId: userId, parentCommentId: { not: null } },
        });
        if (nested.count === 0) break;
      }
      await tx.comment.deleteMany({ where: { authorId: userId } });
      await tx.postLike.deleteMany({ where: { userId } });
      await tx.post.deleteMany({ where: { authorId: userId } });

      await tx.connectionRequest.deleteMany({
        where: { OR: [{ senderId: userId }, { recipientId: userId }] },
      });
      await tx.matchPass.deleteMany({
        where: { OR: [{ userId }, { targetId: userId }] },
      });
      await tx.matchWave.deleteMany({
        where: { OR: [{ senderId: userId }, { targetId: userId }] },
      });

      await tx.user.delete({ where: { id: userId } });
    });
  }
}
