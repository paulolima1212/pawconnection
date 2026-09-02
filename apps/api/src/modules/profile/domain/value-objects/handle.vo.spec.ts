import { ValidationError } from '../../../../shared/domain/result';
import { Handle } from './handle.vo';

describe('Handle', () => {
  it('parses a user-chosen handle and strips @', () => {
    expect(Handle.parse('@Phoebe_1').value).toBe('phoebe_1');
  });

  it('rejects empty, inferred, or too-short handles', () => {
    expect(() => Handle.parse('')).toThrow(ValidationError);
    expect(() => Handle.parse('  @  ')).toThrow(ValidationError);
    expect(() => Handle.parse('ab')).toThrow(/3/);
  });

  it('rejects handles inferred from names (spaces and punctuation)', () => {
    expect(() => Handle.parse('Walking Phoebe')).toThrow(ValidationError);
    expect(() => Handle.parse('plima12121984@gmail.com')).toThrow(ValidationError);
  });

  it('rejects overly long handles', () => {
    expect(() => Handle.parse('a'.repeat(21))).toThrow(ValidationError);
  });

  it('tryNormalize returns null for invalid input', () => {
    expect(Handle.tryNormalize('nope!')).toBeNull();
    expect(Handle.tryNormalize('ok_handle')).toBe('ok_handle');
  });
});
