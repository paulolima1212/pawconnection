import { Inject, Injectable } from '@nestjs/common';
import { ConflictError, NotFoundError } from '../../../shared/domain/result';
import { Handle } from '../domain/value-objects/handle.vo';
import { UniqueHandleSpec } from '../domain/specifications/unique-handle';
import { UserEntity } from '../../../shared/domain/types';
import {
  IPetRepository,
  PET_REPOSITORY,
} from '../domain/repositories/pet.repository';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../domain/repositories/user.repository';
import {
  USER_BLOCK_READER,
  IUserBlockReader,
} from '../../moderation/domain/ports/user-block-reader.port';

@Injectable()
export class GetMyProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }
}

@Injectable()
export class GetPublicProfileByHandleUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(USER_BLOCK_READER) private readonly blocks: IUserBlockReader,
  ) {}

  async execute(
    handle: string,
    viewerId?: string,
  ): Promise<{ user: UserEntity; blockedByMe: boolean }> {
    const user = await this.users.findByHandle(handle);
    if (!user) throw new NotFoundError('Profile not found');
    if (!viewerId || viewerId === user.id) {
      return { user, blockedByMe: false };
    }
    const theyBlockedMe = await this.blocks.isBlockedBy(user.id, viewerId);
    if (theyBlockedMe) throw new NotFoundError('Profile not found');
    const blockedByMe = await this.blocks.isBlockedBy(viewerId, user.id);
    return { user, blockedByMe };
  }
}

@Injectable()
export class UpdateOwnerProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(userId: string, data: Parameters<IUserRepository['updateOwner']>[1]) {
    const existing = await this.users.findById(userId);
    if (!existing) throw new NotFoundError('User not found');
    const next = { ...data };
    if (data.handle != null && data.handle !== '') {
      const handle = Handle.parse(data.handle);
      if (handle.value !== existing.handle) {
        const taken = await this.users.findByHandle(handle.value);
        if (!new UniqueHandleSpec(handle.value).isSatisfiedBy(taken)) {
          throw new ConflictError('Handle already taken');
        }
      }
      next.handle = handle.value;
    }
    return this.users.updateOwner(userId, next);
  }
}

@Injectable()
export class SetUserInterestsUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(userId: string, interests: string[]) {
    const existing = await this.users.findById(userId);
    if (!existing) throw new NotFoundError('User not found');
    return this.users.setInterests(userId, interests);
  }
}

@Injectable()
export class SetUserLookingForUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(userId: string, lookingFor: string[]) {
    const existing = await this.users.findById(userId);
    if (!existing) throw new NotFoundError('User not found');
    return this.users.setLookingFor(userId, lookingFor);
  }
}

@Injectable()
export class CompleteOnboardingUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(userId: string) {
    const existing = await this.users.findById(userId);
    if (!existing) throw new NotFoundError('User not found');
    return this.users.completeOnboarding(userId);
  }
}

@Injectable()
export class UpdatePetProfileUseCase {
  constructor(
    @Inject(PET_REPOSITORY) private readonly pets: IPetRepository,
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(userId: string, data: Parameters<IPetRepository['upsert']>[1]) {
    const existing = await this.users.findById(userId);
    if (!existing) throw new NotFoundError('User not found');
    return this.pets.upsert(userId, data);
  }
}

export function toProfileResponse(user: Awaited<ReturnType<GetMyProfileUseCase['execute']>>) {
  return {
    id: user.id,
    onboardingComplete: user.onboardingComplete,
    interests: user.interests,
    lookingFor: user.lookingFor,
    handle: `@${user.handle}`,
    owner: {
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      age: user.age,
      gender: user.gender,
      location: user.location,
      bio: user.bio,
      photoUrl: user.photoUrl,
      photoUrls: user.photoUrls ?? (user.photoUrl ? [user.photoUrl] : []),
      latitude: user.latitude,
      longitude: user.longitude,
    },
    pet: user.pet
      ? {
          ...user.pet,
          photoUrls: user.pet.photoUrls ?? (user.pet.photoUrl ? [user.pet.photoUrl] : []),
        }
      : null,
  };
}
