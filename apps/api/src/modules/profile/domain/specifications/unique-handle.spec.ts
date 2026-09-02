import { UniqueHandleSpec } from './unique-handle';

describe('UniqueHandleSpec', () => {
  it('is satisfied when no user owns the handle', () => {
    expect(new UniqueHandleSpec('phoebe').isSatisfiedBy(null)).toBe(true);
  });

  it('is not satisfied when another user already has the handle', () => {
    expect(
      new UniqueHandleSpec('phoebe').isSatisfiedBy({ id: 'other' } as never),
    ).toBe(false);
  });
});
