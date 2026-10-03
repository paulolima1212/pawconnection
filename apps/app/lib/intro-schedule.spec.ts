import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  introDayKey,
  isFreshProcess,
  markIntroSettledThisProcess,
  shouldShowStartupIntro,
} from './intro-schedule';

describe('startup intro schedule', () => {
  it('uses the local calendar day', () => {
    assert.equal(introDayKey(new Date(2026, 8, 30, 23, 59)), '2026-09-30');
    assert.equal(introDayKey(new Date(2026, 0, 5)), '2026-01-05');
  });

  it('plays on a cold start even when the intro already ran today', () => {
    assert.equal(shouldShowStartupIntro(true, '2026-09-30', '2026-09-30'), true);
    assert.equal(shouldShowStartupIntro(true, null, '2026-09-30'), true);
  });

  it('plays again the next day while the process is still in memory', () => {
    assert.equal(shouldShowStartupIntro(false, '2026-09-29', '2026-09-30'), true);
    assert.equal(shouldShowStartupIntro(false, null, '2026-09-30'), true);
  });

  it('stays quiet when the process is still in memory and today already played', () => {
    assert.equal(shouldShowStartupIntro(false, '2026-09-30', '2026-09-30'), false);
  });

  it('treats the process as fresh until the intro is settled', () => {
    assert.equal(isFreshProcess(), true);
    markIntroSettledThisProcess();
    assert.equal(isFreshProcess(), false);
  });
});
