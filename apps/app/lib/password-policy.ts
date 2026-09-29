export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.';

export type PasswordRuleId = 'length' | 'upper' | 'lower' | 'number' | 'special';

export const PASSWORD_RULE_LABELS: Record<PasswordRuleId, string> = {
  length: '8+ characters',
  upper: 'Uppercase letter',
  lower: 'Lowercase letter',
  number: 'Number',
  special: 'Special character',
};

export function passwordRuleResults(password: string): Record<PasswordRuleId, boolean> {
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

export function passwordsMatch(password: string, confirmation: string): boolean {
  return confirmation.length > 0 && password === confirmation;
}

export function confirmPasswordMessage(password: string, confirmation: string): string | null {
  if (confirmation.length === 0 || password === confirmation) return null;
  return 'Passwords do not match.';
}
