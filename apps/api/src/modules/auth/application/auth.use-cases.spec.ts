import * as bcrypt from 'bcrypt';
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from '../../../shared/domain/result';
import { normalizeEmail } from '../../../shared/domain/email.util';
import { AppGender, UserEntity } from '../../../shared/domain/types';
import {
  CreateUserInput,
  IUserRepository,
} from '../../profile/domain/repositories/user.repository';
import { LoginUseCase, RegisterUseCase } from './auth.use-cases';

const VALID_PASSWORD = 'Password1!';

class InMemoryUsers implements IUserRepository {
  readonly byEmail = new Map<string, UserEntity>();
  readonly byHandle = new Map<string, UserEntity>();
  readonly byId = new Map<string, UserEntity>();

  async findById(id: string) {
    return this.byId.get(id) ?? null;
  }
  async findByEmail(email: string) {
    const key = normalizeEmail(email);
    for (const [stored, user] of this.byEmail) {
      if (normalizeEmail(stored) === key) return user;
    }
    return null;
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
      password: VALID_PASSWORD,
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
        password: VALID_PASSWORD,
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
      password: VALID_PASSWORD,
      fullName: 'First',
      handle: 'taken',
    });

    await expect(
      useCase.execute({
        email: 'second@paw.test',
        password: VALID_PASSWORD,
        fullName: 'Second',
        handle: 'taken',
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('rejects a password without an uppercase letter', async () => {
    const users = new InMemoryUsers();
    const useCase = new RegisterUseCase(users, jwt);
    await expect(
      useCase.execute({
        email: 'owner@paw.test',
        password: 'password1!',
        fullName: 'Owner',
        handle: 'owner',
      }),
    ).rejects.toThrow(ValidationError);
  });
});

describe('LoginUseCase', () => {
  it('signs in an existing user and omits the password hash', async () => {
    const users = new InMemoryUsers();
    const register = new RegisterUseCase(users, jwt);
    await register.execute({
      email: 'Owner@Paw.test',
      password: VALID_PASSWORD,
      fullName: 'Paulo Lima',
      handle: 'paulo',
    });

    const login = new LoginUseCase(users, jwt);
    const result = await login.execute({
      email: 'owner@paw.test',
      password: VALID_PASSWORD,
    });

    expect(result.accessToken).toBe('token');
    expect(result.user.email).toBe('owner@paw.test');
    expect(result.user.fullName).toBe('Paulo Lima');
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('matches a previously stored mixed-case email', async () => {
    const users = new InMemoryUsers();
    const passwordHash = await bcrypt.hash(VALID_PASSWORD, 4);
    await users.create({
      email: 'Paulo@Paw.test',
      passwordHash,
      fullName: 'Paulo Lima',
      handle: 'paulo_legacy',
    });

    const login = new LoginUseCase(users, jwt);
    const result = await login.execute({
      email: 'paulo@paw.test',
      password: VALID_PASSWORD,
    });
    expect(result.user.id).toBeTruthy();
  });

  it('rejects an incorrect password', async () => {
    const users = new InMemoryUsers();
    const register = new RegisterUseCase(users, jwt);
    await register.execute({
      email: 'owner@paw.test',
      password: VALID_PASSWORD,
      fullName: 'Owner',
      handle: 'owner',
    });
    const login = new LoginUseCase(users, jwt);
    await expect(
      login.execute({ email: 'owner@paw.test', password: 'Wrongpass1!' }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('rejects a nonexistent account', async () => {
    const login = new LoginUseCase(new InMemoryUsers(), jwt);
    await expect(
      login.execute({ email: 'missing@paw.test', password: VALID_PASSWORD }),
    ).rejects.toThrow(UnauthorizedError);
  });
});
