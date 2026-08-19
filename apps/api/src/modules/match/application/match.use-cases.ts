import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { haversineKm, mapUserToSummary } from '../../../shared/infrastructure/mappers/prisma.mapper';
import { MatchCandidate, MatchCandidatesResult, UserEntity } from '../../../shared/domain/types';
import {
  CONNECTION_REQUEST_REPOSITORY,
  IConnectionRequestRepository,
} from '../../connections/domain/repositories/connection-request.repository';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../profile/domain/repositories/user.repository';
import {
  ExcludePassedUsersSpec,
  MatchingInterestSpec,
  MatchingLookingForSpec,
  WithinRadiusSpec,
} from '../domain/specifications/match.spec';
import { MATCH_RADIUS_STEPS_KM } from './match.mapper';

@Injectable()
export class ListMatchCandidatesUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    userId: string,
    options: { radiusKm?: number; expandRadius?: boolean } = {},
  ): Promise<MatchCandidatesResult> {
    const me = await this.users.findById(userId);
    if (!me) {
      return { candidates: [], radiusKm: MATCH_RADIUS_STEPS_KM[0] };
    }

    const excludedIds = await this.collectExcludedTargetIds(userId);

    const pool = await this.users.listCandidates(userId, {
      excludeIds: [...excludedIds],
    });

    const radii = options.radiusKm
      ? [options.radiusKm]
      : options.expandRadius === false
        ? [MATCH_RADIUS_STEPS_KM[0]]
        : [...MATCH_RADIUS_STEPS_KM];

    for (const radiusKm of radii) {
      const candidates = this.buildCandidates(me, pool, excludedIds, radiusKm);
      if (candidates.length > 0 || radiusKm === radii[radii.length - 1]) {
        return { candidates, radiusKm };
      }
    }

    return { candidates: [], radiusKm: radii[radii.length - 1] ?? MATCH_RADIUS_STEPS_KM[0] };
  }

  /** Users already seen or engaged on Find — they stay on Discover for revisits. */
  private async collectExcludedTargetIds(userId: string): Promise<Set<string>> {
    const [passes, waves, conversations, friendshipRequests] = await Promise.all([
      this.prisma.matchPass.findMany({
        where: { userId },
        select: { targetId: true },
      }),
      this.prisma.matchWave.findMany({
        where: { senderId: userId },
        select: { targetId: true },
      }),
      this.prisma.conversation.findMany({
        where: {
          OR: [{ participantOneId: userId }, { participantTwoId: userId }],
        },
        select: { participantOneId: true, participantTwoId: true },
      }),
      this.prisma.connectionRequest.findMany({
        where: {
          type: 'friendship',
          OR: [
            { senderId: userId, status: { in: ['pending', 'accepted'] } },
            { recipientId: userId, status: 'accepted' },
          ],
        },
        select: { senderId: true, recipientId: true },
      }),
    ]);

    const excluded = new Set<string>();
    for (const row of passes) excluded.add(row.targetId);
    for (const row of waves) excluded.add(row.targetId);
    for (const row of conversations) {
      excluded.add(
        row.participantOneId === userId ? row.participantTwoId : row.participantOneId,
      );
    }
    for (const row of friendshipRequests) {
      excluded.add(row.senderId === userId ? row.recipientId : row.senderId);
    }
    return excluded;
  }

  private buildCandidates(
    me: UserEntity,
    pool: UserEntity[],
    excludedIds: Set<string>,
    radiusKm: number,
  ): MatchCandidate[] {
    const excludeSpec = new ExcludePassedUsersSpec(excludedIds);
    const radiusSpec =
      me.latitude != null && me.longitude != null
        ? new WithinRadiusSpec(me.latitude, me.longitude, radiusKm)
        : null;
    const interestSpec = new MatchingInterestSpec(me.interests);
    const lookingForSpec = new MatchingLookingForSpec(me.lookingFor);

    return pool
      .filter((c) => c.pet != null)
      .filter((c) => excludeSpec.isSatisfiedBy(c))
      .filter((c) => (radiusSpec ? radiusSpec.isSatisfiedBy(c) : true))
      .filter((c) => interestSpec.isSatisfiedBy(c))
      .filter((c) => lookingForSpec.isSatisfiedBy(c))
      .map((c) => this.toCandidate(me, c));
  }

  private toCandidate(me: UserEntity, c: UserEntity): MatchCandidate {
    return {
      user: mapUserToSummary({
        id: c.id,
        fullName: c.fullName,
        handle: c.handle,
        photoUrl: c.photoUrl,
        location: c.location,
        pet: c.pet
          ? ({
              id: 'pet',
              userId: c.id,
              name: c.pet.name,
              photoUrl: c.pet.photoUrl,
              age: c.pet.age,
              gender: c.pet.gender,
              breed: c.pet.breed,
            } as never)
          : null,
      } as never),
      pet: c.pet,
      ownerAge: c.age ?? null,
      ownerBio: c.bio ?? null,
      ownerPhotoUrls: c.photoUrls ?? (c.photoUrl ? [c.photoUrl] : []),
      lookingFor: c.lookingFor,
      sharedInterests: c.interests.filter((i) => me.interests.includes(i)),
      sharedLookingFor: c.lookingFor.filter((intent) => me.lookingFor.includes(intent)),
      distanceKm:
        me.latitude != null &&
        me.longitude != null &&
        c.latitude != null &&
        c.longitude != null
          ? haversineKm(me.latitude, me.longitude, c.latitude, c.longitude)
          : null,
    };
  }
}

@Injectable()
export class PassMatchCandidateUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, targetId: string) {
    await this.prisma.matchPass.upsert({
      where: { userId_targetId: { userId, targetId } },
      create: { userId, targetId },
      update: {},
    });
    return { ok: true };
  }
}

@Injectable()
export class SendWaveUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CONNECTION_REQUEST_REPOSITORY)
    private readonly connections: IConnectionRequestRepository,
  ) {}

  async execute(userId: string, targetId: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.matchWave.create({
        data: { senderId: userId, targetId },
      });
      await tx.matchPass.upsert({
        where: { userId_targetId: { userId, targetId } },
        create: { userId, targetId },
        update: {},
      });
    });

    const existing = (await this.connections.listForUser(userId)).find(
      (r) =>
        r.senderId === userId &&
        r.recipientId === targetId &&
        r.type === 'friendship' &&
        r.status === 'pending',
    );
    if (!existing) {
      try {
        await this.connections.create(userId, targetId, 'friendship');
      } catch {
        /* duplicate friendship request — ignore */
      }
    }

    return { wave: true };
  }
}
