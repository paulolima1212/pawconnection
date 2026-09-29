import { ValidationError } from '../../../shared/domain/result';

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.';

/** At least 8 chars, one upper, one lower, one digit, one non-alphanumeric. */
export const PASSWORD_POLICY_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export type PasswordRuleId =
  | 'length'
  | 'upper'
  | 'lower'
  | 'number'
  | 'special';

export function passwordRuleResults(
  password: string,
): Record<PasswordRuleId, boolean> {
  return {
    length: password.length >= PASSWORD_MIN_LENGTH,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export function isPasswordValid(password: string): boolean {
  return Object.values(passwordRuleResults(password)).every(Boolean);
}

export function assertPasswordPolicy(password: string): void {
  if (!isPasswordValid(password)) {
    throw new ValidationError(PASSWORD_POLICY_MESSAGE);
  }
}
