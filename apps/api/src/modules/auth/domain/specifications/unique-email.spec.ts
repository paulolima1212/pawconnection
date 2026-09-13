import { UniqueEmailSpec } from './unique-email';

describe('UniqueEmailSpec', () => {
  it('is satisfied when the email is unused', () => {
    expect(new UniqueEmailSpec('a@paw.test').isSatisfiedBy(null)).toBe(true);
  });
});
