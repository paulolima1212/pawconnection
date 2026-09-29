import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { connectButtonEnabled, connectButtonLabel } from './profile-connection';

describe('profile connect button', () => {
  it('offers connect when there is no request', () => {
    assert.equal(connectButtonLabel('none'), 'Connect');
    assert.equal(connectButtonEnabled('none'), true);
  });

  it('shows a sent request without sending another', () => {
    assert.equal(connectButtonLabel('outgoing'), 'Request sent');
    assert.equal(connectButtonEnabled('outgoing'), false);
  });

  it('accepts a request that the other person sent', () => {
    assert.equal(connectButtonLabel('incoming'), 'Accept');
    assert.equal(connectButtonEnabled('incoming'), true);
  });

  it('shows connected after the request is accepted', () => {
    assert.equal(connectButtonLabel('connected'), 'Connected');
    assert.equal(connectButtonEnabled('connected'), false);
  });
});
