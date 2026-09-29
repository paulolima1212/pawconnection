import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  confirmPasswordMessage,
  isPasswordValid,
  passwordRuleResults,
  passwordsMatch,
} from './password-policy';

describe('password policy', () => {
  it('accepts a valid password', () => {
    assert.equal(isPasswordValid('Password1!'), true);
  });

  it('rejects fewer than 8 characters', () => {
    assert.equal(passwordRuleResults('Aa1!a').length, false);
  });

  it('rejects a missing uppercase letter', () => {
    assert.equal(passwordRuleResults('password1!').upper, false);
  });

  it('rejects a missing lowercase letter', () => {
    assert.equal(passwordRuleResults('PASSWORD1!').lower, false);
  });

  it('rejects a missing number', () => {
    assert.equal(passwordRuleResults('Password!').number, false);
  });

  it('rejects a missing special character', () => {
    assert.equal(passwordRuleResults('Password1').special, false);
  });

  it('requires the confirmation to match the password', () => {
    assert.equal(passwordsMatch('Password1!', 'Password1!'), true);
    assert.equal(passwordsMatch('Password1!', 'Password1'), false);
    assert.equal(passwordsMatch('Password1!', ''), false);
    assert.equal(confirmPasswordMessage('Password1!', ''), null);
    assert.equal(confirmPasswordMessage('Password1!', 'Password1!'), null);
    assert.equal(confirmPasswordMessage('Password1!', 'other'), 'Passwords do not match.');
  });
});
