import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConflictError } from '../../../shared/domain/result';
import { handleFromFullName } from '../../../shared/domain/types';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../profile/domain/repositories/user.repository';
import { UniqueEmailSpec } from '../domain/specifications/unique-email.spec';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly jwt: JwtService,
  ) {}

  async execute(input: { email: string; password: string; fullName: string }) {
    const existing = await this.users.findByEmail(input.email);
    const spec = new UniqueEmailSpec(input.email);
    if (!spec.isSatisfiedBy(existing)) {
      throw new ConflictError('Email already registered');
    }

    let handle = handleFromFullName(input.fullName);
    let suffix = 0;
    while (await this.users.findByHandle(handle)) {
      suffix += 1;
      handle = `${handleFromFullName(input.fullName)}${suffix}`;
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.users.create({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      handle,
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
