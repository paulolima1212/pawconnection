import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  isOnboardingPath,
  shouldRedirectCompletedUserFromSignup,
  shouldResetOnboardingBack,
} from './onboarding-back';

describe('back after onboarding', () => {
  it('recognizes the registration screens', () => {
    assert.equal(isOnboardingPath('/setup-you'), true);
    assert.equal(isOnboardingPath('/social-feed'), false);
  });

  it('sends back to home when the previous screen is registration', () => {
    assert.equal(
      shouldResetOnboardingBack(true, {
        index: 3,
        routes: [
          { name: 'interests' },
          { name: 'setup-dog' },
          { name: 'setup-you' },
          { name: '(main)' },
        ],
      }),
      true,
    );
  });

  it('keeps back inside registration until it is finished', () => {
    assert.equal(
      shouldResetOnboardingBack(false, {
        index: 1,
        routes: [{ name: 'setup-dog' }, { name: 'setup-you' }],
      }),
      false,
    );
  });

  it('lets back leave a post or chat that sits on top of home', () => {
    assert.equal(
      shouldResetOnboardingBack(true, {
        index: 1,
        routes: [{ name: '(main)' }, { name: 'new-post' }],
      }),
      false,
    );
  });

  it('lets a logged-out person start signup even if this device finished onboarding before', () => {
    assert.equal(shouldRedirectCompletedUserFromSignup(false, true, '/interests'), false);
    assert.equal(shouldRedirectCompletedUserFromSignup(true, false, '/interests'), false);
    assert.equal(shouldRedirectCompletedUserFromSignup(true, true, '/social-feed'), false);
  });

  it('returns a signed-in user who already finished signup to home', () => {
    assert.equal(shouldRedirectCompletedUserFromSignup(true, true, '/interests'), true);
  });

  it('lets back exit when home is the only screen', () => {
    assert.equal(
      shouldResetOnboardingBack(true, {
        index: 0,
        routes: [{ name: '(main)' }],
      }),
      false,
    );
  });
});
