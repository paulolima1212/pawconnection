import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  FRIENDSHIP_EMPTY,
  FRIENDSHIP_ERRORS,
  friendSubtitle,
  mutualFriendsLabel,
} from './friendship-copy';

describe('friendship copy', () => {
  it('describes the dog and mutual friends', () => {
    assert.equal(friendSubtitle('Luna', 'Golden Retriever'), 'Luna • Golden Retriever');
    assert.equal(mutualFriendsLabel(12), '12 mutual friends');
    assert.equal(mutualFriendsLabel(1), '1 mutual friend');
  });

  it('has empty and error copy for every friends section', () => {
    assert.match(FRIENDSHIP_EMPTY.requests, /friend requests/);
    assert.match(FRIENDSHIP_EMPTY.friends, /No friends/);
    assert.match(FRIENDSHIP_EMPTY.suggestions, /suggestions/);
    assert.match(FRIENDSHIP_ERRORS.friends, /Try again/);
  });
});
