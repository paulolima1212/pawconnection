import {
  createPasswordResetToken,
  hashPasswordResetToken,
} from './password-reset-token.util';

describe('password reset token util', () => {
  it('creates a raw token and matching hash', () => {
    const { raw, hash } = createPasswordResetToken();

    expect(raw).toHaveLength(64);
    expect(hashPasswordResetToken(raw)).toBe(hash);
  });

  it('hashes tokens deterministically', () => {
    const raw = 'abc123';
    expect(hashPasswordResetToken(raw)).toBe(hashPasswordResetToken(raw));
  });
});
