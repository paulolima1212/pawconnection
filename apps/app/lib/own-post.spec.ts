import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isOwnPost } from './own-post';

describe('isOwnPost', () => {
  it('matches the author id on the post', () => {
    assert.equal(isOwnPost({ authorId: 'me' }, 'me'), true);
    assert.equal(isOwnPost({ authorId: 'me', author: { id: 'other' } }, 'other'), true);
  });

  it('rejects a different viewer', () => {
    assert.equal(isOwnPost({ authorId: 'me' }, 'them'), false);
    assert.equal(isOwnPost({ authorId: 'me' }, null), false);
  });
});
