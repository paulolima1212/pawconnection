import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AppGender, UserEntity } from '../../../shared/domain/types';
import { ValidationError } from '../../../shared/domain/result';
import { IEmailSender } from '../../../shared/domain/ports/email-sender.port';
import {
  CreateUserInput,
  IUserRepository,
} from '../../profile/domain/repositories/user.repository';
import { hashPasswordResetToken } from '../domain/password-reset-token.util';
import {
  IPasswordResetTokenRepository,
  PasswordResetTokenRecord,
} from '../domain/repositories/password-reset-token.repository';
import {
  RequestPasswordResetUseCase,
  ResetPasswordUseCase,
} from './password-reset.use-cases';

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
  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    const user = this.byId.get(userId);
    if (user) user.passwordHash = passwordHash;
  }
  async listCandidates(): Promise<UserEntity[]> {
    return [];
  }
  async deleteById(): Promise<void> {}
}

class InMemoryResetTokens implements IPasswordResetTokenRepository {
  private seq = 1;
  readonly rows: Array<
    PasswordResetTokenRecord & { tokenHash: string; usedAt: Date | null }
  > = [];

  async deleteByUserId(userId: string): Promise<void> {
    for (let i = this.rows.length - 1; i >= 0; i -= 1) {
      if (this.rows[i].userId === userId) this.rows.splice(i, 1);
    }
  }

  async create(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    this.rows.push({
      id: `t-${this.seq++}`,
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      usedAt: null,
    });
  }

  async findValidByTokenHash(
    tokenHash: string,
  ): Promise<PasswordResetTokenRecord | null> {
    const row = this.rows.find(
      (item) =>
        item.tokenHash === tokenHash &&
        item.usedAt === null &&
        item.expiresAt.getTime() > Date.now(),
    );
    return row ? { id: row.id, userId: row.userId, expiresAt: row.expiresAt } : null;
  }

  async markUsed(id: string): Promise<void> {
    const row = this.rows.find((item) => item.id === id);
    if (row) row.usedAt = new Date();
  }
}

class FakeEmail implements IEmailSender {
  readonly sent: Array<{ to: string; subject: string; text: string; html?: string }> =
    [];
  failWith: Error | null = null;

  async send(message: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<void> {
    if (this.failWith) throw this.failWith;
    this.sent.push(message);
  }
}

function configStub(appUrl = 'https://paw-app.lz-plima1212.online/') {
  return {
    get: (key: string, fallback?: string) =>
      key === 'APP_URL' ? appUrl : fallback,
  } as unknown as ConfigService;
}

describe('RequestPasswordResetUseCase', () => {
  it('returns a generic message and does not email unknown addresses', async () => {
    const users = new InMemoryUsers();
    const tokens = new InMemoryResetTokens();
    const email = new FakeEmail();
    const useCase = new RequestPasswordResetUseCase(
      users,
      tokens,
      email,
      configStub(),
    );

    const result = await useCase.execute({ email: 'missing@paw.test' });

    expect(result.message).toContain('If an account exists');
    expect(email.sent).toHaveLength(0);
    expect(tokens.rows).toHaveLength(0);
  });

  it('emails a reset link when the account has a password', async () => {
    const users = new InMemoryUsers();
    const tokens = new InMemoryResetTokens();
    const email = new FakeEmail();
    const user = await users.create({
      email: 'owner@paw.test',
      passwordHash: 'hash',
      fullName: 'Owner',
      handle: 'owner',
    });
    const useCase = new RequestPasswordResetUseCase(
      users,
      tokens,
      email,
      configStub(),
    );

    await useCase.execute({ email: '  Owner@paw.test ' });

    expect(tokens.rows).toHaveLength(1);
    expect(tokens.rows[0].userId).toBe(user.id);
    expect(email.sent).toHaveLength(1);
    expect(email.sent[0].to).toBe('owner@paw.test');
    expect(email.sent[0].text).toContain(
      'https://paw-app.lz-plima1212.online/reset-password?token=',
    );
    const token = email.sent[0].text.match(/token=([a-f0-9]+)/)?.[1];
    expect(token).toHaveLength(64);
    expect(tokens.rows[0].tokenHash).toBe(hashPasswordResetToken(token!));
  });

  it('surfaces a send failure so the user can retry', async () => {
    const users = new InMemoryUsers();
    const tokens = new InMemoryResetTokens();
    const email = new FakeEmail();
    email.failWith = new Error('Failed to send email via Resend: 403');
    await users.create({
      email: 'owner@paw.test',
      passwordHash: 'hash',
      fullName: 'Owner',
      handle: 'owner',
    });
    const useCase = new RequestPasswordResetUseCase(
      users,
      tokens,
      email,
      configStub(),
    );

    await expect(useCase.execute({ email: 'owner@paw.test' })).rejects.toThrow(
      ValidationError,
    );
  });
});

describe('ResetPasswordUseCase', () => {
  it('rejects an invalid token', async () => {
    const users = new InMemoryUsers();
    const tokens = new InMemoryResetTokens();
    const useCase = new ResetPasswordUseCase(users, tokens);

    await expect(
      useCase.execute({ token: 'nope', password: 'newpassword' }),
    ).rejects.toThrow(ValidationError);
  });

  it('updates the password for a valid token', async () => {
    const users = new InMemoryUsers();
    const tokens = new InMemoryResetTokens();
    const user = await users.create({
      email: 'owner@paw.test',
      passwordHash: 'old-hash',
      fullName: 'Owner',
      handle: 'owner',
    });
    const raw = 'a'.repeat(64);
    await tokens.create({
      userId: user.id,
      tokenHash: hashPasswordResetToken(raw),
      expiresAt: new Date(Date.now() + 60_000),
    });
    const useCase = new ResetPasswordUseCase(users, tokens);

    const result = await useCase.execute({ token: raw, password: 'newpassword' });

    expect(result.message).toContain('Password updated');
    expect(tokens.rows).toHaveLength(0);
    const updated = await users.findById(user.id);
    expect(updated?.passwordHash).not.toBe('old-hash');
    expect(await bcrypt.compare('newpassword', updated?.passwordHash ?? '')).toBe(
      true,
    );
  });
});
