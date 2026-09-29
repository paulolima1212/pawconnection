import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { INTRO_DURATION_MS, shouldCompleteIntro } from './intro-playback';

describe('intro playback completion', () => {
  it('waits until the composition has finished', () => {
    assert.equal(shouldCompleteIntro(0, false), false);
    assert.equal(shouldCompleteIntro(INTRO_DURATION_MS - 201, false), false);
  });

  it('completes once the animation has played through', () => {
    assert.equal(shouldCompleteIntro(INTRO_DURATION_MS - 200, false), true);
    assert.equal(shouldCompleteIntro(INTRO_DURATION_MS, false), true);
  });

  it('ignores a cancelled finish so unmount does not navigate twice', () => {
    assert.equal(shouldCompleteIntro(INTRO_DURATION_MS, true), false);
  });
});
