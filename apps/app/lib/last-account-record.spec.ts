import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseLastAccount, serializeLastAccount } from './last-account-record';

describe('last account', () => {
  it('stores only the identity fields', () => {
    const raw = serializeLastAccount({
      userId: 'user-1',
      email: 'Paulo@Paw.test',
      displayName: 'Paulo Lima',
      photoUrl: 'https://cdn.example/p.jpg',
    });
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    assert.deepEqual(Object.keys(parsed).sort(), ['displayName', 'email', 'photoUrl', 'userId']);
    assert.equal(parsed.email, 'paulo@paw.test');
    assert.equal('password' in parsed, false);
  });

  it('refuses a record that includes a password', () => {
    assert.equal(
      parseLastAccount(
        JSON.stringify({
          userId: 'user-1',
          email: 'paulo@paw.test',
          displayName: 'Paulo Lima',
          photoUrl: null,
          password: 'secret',
        }),
      ),
      null,
    );
  });
});
