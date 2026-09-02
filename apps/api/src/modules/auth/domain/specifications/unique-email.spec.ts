import { Injectable } from '@nestjs/common';
import { CompositeSpecification } from '../../../../shared/domain/specification';
import { UserEntity } from '../../../../shared/domain/types';

export class UniqueEmailSpec extends CompositeSpecification<UserEntity | null> {
  constructor(private readonly email: string) {
    super();
  }

  isSatisfiedBy(candidate: UserEntity | null): boolean {
    return candidate === null;
  }

  getEmail(): string {
    return this.email;
  }
}

describe('UniqueEmailSpec', () => {
  it('is satisfied when the email is unused', () => {
    expect(new UniqueEmailSpec('a@paw.test').isSatisfiedBy(null)).toBe(true);
  });
});
