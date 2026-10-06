import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  connectButtonEnabled,
  connectButtonLabel,
  showCancelRequest,
  showDeclineRequest,
  showUnfriend,
  unfriendConfirmMessage,
} from './profile-connection';

describe('friendship profile actions', () => {
  it('offers Add Friend when there is no relationship', () => {
    assert.equal(connectButtonLabel('none'), 'Add Friend');
    assert.equal(connectButtonEnabled('none'), true);
    assert.equal(showCancelRequest('none'), false);
  });

  it('shows a sent request and allows cancel', () => {
    assert.equal(connectButtonLabel('outgoing'), 'Request sent');
    assert.equal(connectButtonEnabled('outgoing'), false);
    assert.equal(showCancelRequest('outgoing'), true);
  });

  it('offers accept and decline for an incoming request', () => {
    assert.equal(connectButtonLabel('incoming'), 'Accept');
    assert.equal(connectButtonEnabled('incoming'), true);
    assert.equal(showDeclineRequest('incoming'), true);
  });

  it('shows Friends and asks before unfriend', () => {
    assert.equal(connectButtonLabel('connected'), 'Friends');
    assert.equal(showUnfriend('connected'), true);
    assert.equal(unfriendConfirmMessage('Maria'), 'Remove Maria from your friends?');
  });

  it('does not offer friend actions when blocked', () => {
    assert.equal(connectButtonLabel('blocked'), 'Blocked');
    assert.equal(connectButtonEnabled('blocked'), false);
    assert.equal(showUnfriend('blocked'), false);
  });
});
