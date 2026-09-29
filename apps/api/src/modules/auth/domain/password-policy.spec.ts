import {
  PASSWORD_POLICY_MESSAGE,
  assertPasswordPolicy,
  passwordRuleResults,
} from './password-policy';
import { ValidationError } from '../../../shared/domain/result';

describe('password policy', () => {
  it('accepts a password that meets every rule', () => {
    expect(passwordRuleResults('Password1!')).toEqual({
      length: true,
      upper: true,
      lower: true,
      number: true,
      special: true,
    });
    expect(() => assertPasswordPolicy('Password1!')).not.toThrow();
  });

  it('rejects fewer than 8 characters', () => {
    expect(passwordRuleResults('Aa1!aaa').length).toBe(false);
    expect(() => assertPasswordPolicy('Aa1!a')).toThrow(ValidationError);
    expect(() => assertPasswordPolicy('Aa1!a')).toThrow(
      PASSWORD_POLICY_MESSAGE,
    );
  });

  it('rejects a missing uppercase letter', () => {
    expect(passwordRuleResults('password1!').upper).toBe(false);
  });

  it('rejects a missing lowercase letter', () => {
    expect(passwordRuleResults('PASSWORD1!').lower).toBe(false);
  });

  it('rejects a missing number', () => {
    expect(passwordRuleResults('Password!').number).toBe(false);
  });

  it('rejects a missing special character', () => {
    expect(passwordRuleResults('Password1').special).toBe(false);
  });
});
