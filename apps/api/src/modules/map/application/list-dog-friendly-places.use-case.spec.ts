import { UserEntity } from '../../../shared/domain/types';
import { ValidationError } from '../../../shared/domain/result';
import { NearbyPlaceHit, IPlacesSearch } from '../domain/ports/places-search.port';
import { IUserRepository } from '../../profile/domain/repositories/user.repository';
import { ListDogFriendlyPlacesUseCase } from './list-dog-friendly-places.use-case';
import { AppInterest, AppGender, AppVaccinated, AppDesexed } from '../../../shared/domain/types';

function user(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: 'viewer-1',
    fullName: 'Alex',
    handle: 'alex',
    gender: AppGender.Female,
    onboardingComplete: true,
    verified: true,
    interests: [AppInterest.DogServices],
    lookingFor: [],
    pet: {
      name: 'Luna',
      temperament: [],
      vaccinated: AppVaccinated.Yes,
      desexed: AppDesexed.Yes,
      gender: AppGender.Female,
      enjoysPark: false,
      enjoysWater: false,
      enjoysWalks: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

class FakeUsers implements IUserRepository {
  constructor(private readonly row: UserEntity | null) {}
  findById(): Promise<UserEntity | null> {
    return Promise.resolve(this.row);
  }
  findByEmail(): Promise<UserEntity | null> {
    return Promise.resolve(null);
  }
  findByHandle(): Promise<UserEntity | null> {
    return Promise.resolve(null);
  }
  create(): Promise<UserEntity> {
    throw new Error('not implemented');
  }
  updateOwner(): Promise<UserEntity> {
    throw new Error('not implemented');
  }
  setInterests(): Promise<UserEntity> {
    throw new Error('not implemented');
  }
  setLookingFor(): Promise<UserEntity> {
    throw new Error('not implemented');
  }
  completeOnboarding(): Promise<UserEntity> {
    throw new Error('not implemented');
  }
  updatePasswordHash(): Promise<void> {
    return Promise.resolve();
  }
  listCandidates(): Promise<UserEntity[]> {
    return Promise.resolve([]);
  }
  deleteById(): Promise<void> {
    return Promise.resolve();
  }
}

class FakePlaces implements IPlacesSearch {
  readonly calls: Array<{ includedTypes: readonly string[]; radiusMeters: number }> = [];
  constructor(private readonly hits: NearbyPlaceHit[]) {}
  searchNearby(query: {
    includedTypes: readonly string[];
    radiusMeters: number;
  }): Promise<NearbyPlaceHit[]> {
    this.calls.push({ includedTypes: query.includedTypes, radiusMeters: query.radiusMeters });
    return Promise.resolve(this.hits);
  }
}

const nearbyHits: NearbyPlaceHit[] = [
  {
    id: 'cafe-no-dogs',
    name: 'No dogs cafe',
    latitude: -33.86,
    longitude: 151.209,
    types: ['cafe'],
    primaryType: 'cafe',
    allowsDogs: null,
    address: '1 George St',
  },
  {
    id: 'vet',
    name: 'City Vet',
    latitude: -33.861,
    longitude: 151.21,
    types: ['veterinary_care'],
    primaryType: 'veterinary_care',
    allowsDogs: null,
    address: '2 George St',
  },
  {
    id: 'park',
    name: 'Hyde Park',
    latitude: -33.87,
    longitude: 151.21,
    types: ['park'],
    primaryType: 'park',
    allowsDogs: null,
    address: 'Park St',
  },
];

describe('ListDogFriendlyPlacesUseCase', () => {
  it('rejects invalid coordinates', async () => {
    const useCase = new ListDogFriendlyPlacesUseCase(new FakeUsers(user()), new FakePlaces([]));
    await expect(
      useCase.execute('viewer-1', { latitude: 200, longitude: 0 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('filters out non dog-friendly cafes and features services for that profile', async () => {
    const places = new FakePlaces(nearbyHits);
    const useCase = new ListDogFriendlyPlacesUseCase(new FakeUsers(user()), places);
    const result = await useCase.execute('viewer-1', {
      latitude: -33.86,
      longitude: 151.21,
      radiusKm: 2,
      category: 'forYou',
    });

    expect(result.radiusKm).toBe(2);
    expect(result.featuredCategory).toBe('services');
    expect(result.items.map((p) => p.id)).toEqual(['vet']);
    expect(places.calls[0]?.includedTypes).toEqual(['dog_park', 'veterinary_care', 'pet_store']);
  });

  it('uses the default radius when worldwide is requested', async () => {
    const places = new FakePlaces([]);
    const useCase = new ListDogFriendlyPlacesUseCase(new FakeUsers(user()), places);
    const result = await useCase.execute('viewer-1', {
      latitude: -33.86,
      longitude: 151.21,
    });
    expect(result.radiusKm).toBe(5);
    expect(places.calls[0]?.radiusMeters).toBe(5000);
  });

  it('returns an empty list when the provider fails', async () => {
    const failing: IPlacesSearch = {
      searchNearby: () => Promise.reject(new Error('quota')),
    };
    const useCase = new ListDogFriendlyPlacesUseCase(new FakeUsers(user()), failing);
    const result = await useCase.execute('viewer-1', {
      latitude: -33.86,
      longitude: 151.21,
      category: 'parks',
    });
    expect(result.items).toEqual([]);
    expect(result.category).toBe('parks');
  });
});
