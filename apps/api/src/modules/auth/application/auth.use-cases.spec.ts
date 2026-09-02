import { ConflictError, ValidationError } from '../../../shared/domain/result';
import { AppGender, UserEntity } from '../../../shared/domain/types';
import {
  CreateUserInput,
  IUserRepository,
} from '../../profile/domain/repositories/user.repository';
import { RegisterUseCase } from './auth.use-cases';

class InMemoryUsers implements IUserRepository {
  readonly byEmail = new Map<string, UserEntity>();
  readonly byHandle = new Map<string, UserEntity>();
  readonly byId = new Map<string, UserEntity>();

  async findById(id: string) {
    return this.byId.get(id) ?? null;
  }
  async findByEmail(email: string) {
    return this.byEmail.get(email) ?? null;
  }
  async findByHandle(handle: string) {
    return this.byHandle.get(handle) ?? null;
  }
  async create(input: CreateUserInput): Promise<UserEntity> {
    const user: UserEntity = {
      id: `u-${this.byId.size + 1}`,
      email: input.email,
      passwordHash: input.passwordHash,
      fullName: input.fullName,
      handle: input.handle,
      gender: AppGender.Male,
      onboardingComplete: false,
      verified: false,
      interests: [],
      lookingFor: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.byId.set(user.id, user);
    if (user.email) this.byEmail.set(user.email, user);
    this.byHandle.set(user.handle, user);
    return user;
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
  async updatePasswordHash(): Promise<void> {}
  async listCandidates(): Promise<UserEntity[]> {
    return [];
  }
  async deleteById(): Promise<void> {}
}

const jwt = { sign: () => 'token' } as never;

describe('RegisterUseCase', () => {
  it('persists the handle the user chose', async () => {
    const users = new InMemoryUsers();
    const useCase = new RegisterUseCase(users, jwt);

    const result = await useCase.execute({
      email: 'owner@paw.test',
      password: 'password123',
      fullName: 'Walking Phoebe',
      handle: '@My_Phoebe',
    });

    expect(result.user.handle).toBe('my_phoebe');
    expect(result.accessToken).toBe('token');
  });

  it('does not infer a handle from the full name', async () => {
    const users = new InMemoryUsers();
    const useCase = new RegisterUseCase(users, jwt);

    await expect(
      useCase.execute({
        email: 'owner@paw.test',
        password: 'password123',
        fullName: 'Walking Phoebe',
        handle: '',
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('rejects a handle that is already taken', async () => {
    const users = new InMemoryUsers();
    const useCase = new RegisterUseCase(users, jwt);
    await useCase.execute({
      email: 'first@paw.test',
      password: 'password123',
      fullName: 'First',
      handle: 'taken',
    });

    await expect(
      useCase.execute({
        email: 'second@paw.test',
        password: 'password123',
        fullName: 'Second',
        handle: 'taken',
      }),
    ).rejects.toThrow(ConflictError);
  });
});
