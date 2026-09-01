import { InMemoryDeadLetterQueue } from '../../../shared/events/dead-letter-queue';
import { InMemoryEventBus } from '../../../shared/events/in-memory-event-bus';
import { IEventBus } from '../../../shared/events/event-bus';
import { NotFoundError } from '../../../shared/domain/result';
import {
  AppDesexed,
  AppGender,
  AppVaccinated,
  UserEntity,
} from '../../../shared/domain/types';
import { PROFILE_EVENTS } from '../domain/events/profile-events';
import { IAccountMediaCleaner } from '../domain/ports/account-media-cleaner.port';
import { IUserRepository } from '../domain/repositories/user.repository';
import { collectProfileMediaUrls } from '../domain/profile-media-urls';
import { DeleteAccountUseCase } from './delete-account.use-case';

function sampleUser(overrides: Partial<UserEntity> = {}): UserEntity {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: 'user-1',
    email: 'owner@example.com',
    fullName: 'Alex Owner',
    handle: 'alexowner',
    gender: AppGender.Male,
    onboardingComplete: true,
    verified: false,
    interests: [],
    lookingFor: [],
    photoUrl: 'https://cdn.example/users/user-1.jpg',
    photoUrls: ['https://cdn.example/users/user-1.jpg'],
    pet: {
      name: 'Pluto',
      temperament: [],
      vaccinated: AppVaccinated.Yes,
      desexed: AppDesexed.No,
      gender: AppGender.Male,
      enjoysPark: true,
      enjoysWater: true,
      enjoysWalks: true,
      photoUrl: 'https://cdn.example/pets/pluto.jpg',
      photoUrls: ['https://cdn.example/pets/pluto.jpg'],
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

class InMemoryUserRepository implements IUserRepository {
  constructor(private readonly users = new Map<string, UserEntity>()) {}

  async findById(id: string): Promise<UserEntity | null> {
    return this.users.get(id) ?? null;
  }
  async findByEmail(): Promise<UserEntity | null> {
    return null;
  }
  async findByHandle(): Promise<UserEntity | null> {
    return null;
  }
  async create(): Promise<UserEntity> {
    throw new Error('not used');
  }
  async updateOwner(): Promise<UserEntity> {
    throw new Error('not used');
  }
  async setInterests(): Promise<UserEntity> {
    throw new Error('not used');
  }
  async setLookingFor(): Promise<UserEntity> {
    throw new Error('not used');
  }
  async completeOnboarding(): Promise<UserEntity> {
    throw new Error('not used');
  }
  async updatePasswordHash(): Promise<void> {
    throw new Error('not used');
  }
  async listCandidates(): Promise<UserEntity[]> {
    return [];
  }
  async deleteById(id: string): Promise<void> {
    this.users.delete(id);
  }
}

class RecordingMediaCleaner implements IAccountMediaCleaner {
  readonly removed: string[][] = [];
  failNext = false;

  async removeObjectUrls(urls: string[]): Promise<void> {
    if (this.failNext) {
      this.failNext = false;
      throw new Error('storage unavailable');
    }
    this.removed.push(urls);
  }
}

function makeBus(): { bus: IEventBus; received: string[] } {
  const received: string[] = [];
  const bus = new InMemoryEventBus(new InMemoryDeadLetterQueue(), {
    maxAttempts: 1,
    retryBaseDelayMs: 1,
  });
  bus.subscribe(PROFILE_EVENTS.ACCOUNT_DELETED, {
    handlerName: 'probe-account-deleted',
    handle: (event) => {
      received.push(event.eventType);
    },
  });
  return { bus, received };
}

describe('collectProfileMediaUrls', () => {
  it('deduplicates owner and pet photo URLs', () => {
    const urls = collectProfileMediaUrls(sampleUser());
    expect(urls).toEqual([
      'https://cdn.example/users/user-1.jpg',
      'https://cdn.example/pets/pluto.jpg',
    ]);
  });
});

describe('DeleteAccountUseCase', () => {
  it('GivenExistingUser_WhenDeleteAccount_ThenUserIsRemovedAndEventIsPublished', async () => {
    const user = sampleUser();
    const repo = new InMemoryUserRepository(new Map([[user.id, user]]));
    const cleaner = new RecordingMediaCleaner();
    const { bus, received } = makeBus();
    const useCase = new DeleteAccountUseCase(repo, cleaner, bus);

    await useCase.execute(user.id);

    expect(await repo.findById(user.id)).toBeNull();
    expect(received).toEqual([PROFILE_EVENTS.ACCOUNT_DELETED]);
    expect(cleaner.removed).toEqual([
      [
        'https://cdn.example/users/user-1.jpg',
        'https://cdn.example/pets/pluto.jpg',
      ],
    ]);
  });

  it('GivenUnknownUser_WhenDeleteAccount_ThenNotFound', async () => {
    const repo = new InMemoryUserRepository();
    const cleaner = new RecordingMediaCleaner();
    const { bus } = makeBus();
    const useCase = new DeleteAccountUseCase(repo, cleaner, bus);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(NotFoundError);
    expect(cleaner.removed).toEqual([]);
  });

  it('GivenStorageFailure_WhenDeleteAccount_ThenAccountIsStillDeleted', async () => {
    const user = sampleUser();
    const repo = new InMemoryUserRepository(new Map([[user.id, user]]));
    const cleaner = new RecordingMediaCleaner();
    cleaner.failNext = true;
    const { bus, received } = makeBus();
    const useCase = new DeleteAccountUseCase(repo, cleaner, bus);

    await useCase.execute(user.id);

    expect(await repo.findById(user.id)).toBeNull();
    expect(received).toEqual([PROFILE_EVENTS.ACCOUNT_DELETED]);
  });
});
