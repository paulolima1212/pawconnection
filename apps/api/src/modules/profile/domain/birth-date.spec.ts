import { ValidationError } from '../../../shared/domain/result';
import {
  assertDogAge,
  assertDogBirthDate,
  assertOwnerBirthDate,
  parseIsoDate,
} from './birth-date';

const now = new Date(Date.UTC(2026, 8, 26));

describe('birth date', () => {
  it('rejects an impossible calendar date', () => {
    expect(parseIsoDate('2026-02-31')).toBeNull();
    expect(() => assertOwnerBirthDate('2026-02-31', now)).toThrow(
      ValidationError,
    );
  });

  it('rejects a future owner date', () => {
    expect(() => assertOwnerBirthDate('2026-09-27', now)).toThrow(/future/);
  });

  it('accepts a manual owner date and derives age', () => {
    expect(assertOwnerBirthDate('1990-09-26', now)).toBe(36);
  });

  it('rejects a future dog date', () => {
    expect(() => assertDogBirthDate('2026-12-01', now)).toThrow(/future/);
  });

  it('accepts dog ages 0 and 16', () => {
    expect(assertDogBirthDate('2026-09-26', now)).toBe(0);
    expect(assertDogBirthDate('2010-09-26', now)).toBe(16);
    expect(() => assertDogAge(0)).not.toThrow();
    expect(() => assertDogAge(8)).not.toThrow();
    expect(() => assertDogAge(16)).not.toThrow();
  });

  it('rejects dog ages outside 0 through 16', () => {
    expect(() => assertDogAge(-1)).toThrow(/0 and 16/);
    expect(() => assertDogAge(17)).toThrow(/0 and 16/);
    expect(() => assertDogBirthDate('2009-09-25', now)).toThrow(/0 and 16/);
  });
});
