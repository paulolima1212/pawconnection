import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConflictError } from '../../../shared/domain/result';
import { Handle } from '../../profile/domain/value-objects/handle.vo';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../profile/domain/repositories/user.repository';
import { UniqueEmailSpec } from '../domain/specifications/unique-email.spec';
import { UniqueHandleSpec } from '../../profile/domain/specifications/unique-handle';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly jwt: JwtService,
  ) {}

  async execute(input: { email: string; password: string; fullName: string; handle: string }) {
    const existing = await this.users.findByEmail(input.email);
    const spec = new UniqueEmailSpec(input.email);
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
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      handle: handle.value,
    });

    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
    });

    return { accessToken: token, user };
  }
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly jwt: JwtService,
  ) {}

  async execute(input: { email: string; password: string }) {
    const user = await this.users.findByEmail(input.email);
    if (!user?.passwordHash) {
      throw new ConflictError('Invalid credentials');
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new ConflictError('Invalid credentials');
    }

    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
    });

    return { accessToken: token, user };
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
