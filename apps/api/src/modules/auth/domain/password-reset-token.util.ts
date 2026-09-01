import { createHash, randomBytes } from 'crypto';

export function createPasswordResetToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('hex');
  const hash = hashPasswordResetToken(raw);
  return { raw, hash };
}

export function hashPasswordResetToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
