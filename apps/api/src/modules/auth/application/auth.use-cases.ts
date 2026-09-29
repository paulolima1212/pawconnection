import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  ConflictError,
  UnauthorizedError,
} from '../../../shared/domain/result';
import { UserEntity } from '../../../shared/domain/types';
import { Handle } from '../../profile/domain/value-objects/handle.vo';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../profile/domain/repositories/user.repository';
import { normalizeEmail } from '../../../shared/domain/email.util';
import { assertPasswordPolicy } from '../domain/password-policy';
import { UniqueEmailSpec } from '../domain/specifications/unique-email';
import { UniqueHandleSpec } from '../../profile/domain/specifications/unique-handle';

export type AuthSessionUser = {
  id: string;
  email?: string | null;
  fullName: string;
  handle: string;
  photoUrl?: string | null;
  onboardingComplete: boolean;
};

function toAuthSessionUser(user: UserEntity): AuthSessionUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    handle: user.handle,
    photoUrl: user.photoUrl ?? null,
    onboardingComplete: user.onboardingComplete,
  };
}

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly jwt: JwtService,
  ) {}

  async execute(input: {
    email: string;
    password: string;
    fullName: string;
    handle: string;
  }) {
    assertPasswordPolicy(input.password);
    const email = normalizeEmail(input.email);
    const existing = await this.users.findByEmail(email);
    const spec = new UniqueEmailSpec(email);
    if (!spec.isSatisfiedBy(existing)) {
      throw new ConflictError('Email already registered');
    }

    const handle = Handle.parse(input.handle);
    const taken = await this.users.findByHandle(handle.value);
    if (!new UniqueHandleSpec(handle.value).isSatisfiedBy(taken)) {
      throw new ConflictError('Handle already taken');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.users.create({
      email,
      passwordHash,
      fullName: input.fullName,
      handle: handle.value,
    });

    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
    });

    return { accessToken: token, user: toAuthSessionUser(user) };
  }
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly jwt: JwtService,
  ) {}

  async execute(input: { email: string; password: string }) {
    const email = normalizeEmail(input.email);
    const user = await this.users.findByEmail(email);
    if (!user?.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
    });

    return { accessToken: token, user: toAuthSessionUser(user) };
  }
}

@Injectable()
export class GetAuthMeUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new ConflictError('User not found');
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      handle: `@${user.handle}`,
      onboardingComplete: user.onboardingComplete,
    };
  }
}
