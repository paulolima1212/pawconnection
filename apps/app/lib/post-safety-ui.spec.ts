import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  isPostSafetyBlockVisible,
  isPostSafetyMenuVisible,
  isPostSafetyReportVisible,
  reducePostSafetyUi,
  type PostSafetyUiState,
} from './post-safety-ui';

const post = { id: 'post-1' };

function menuOpen(): PostSafetyUiState<typeof post> {
  return reducePostSafetyUi({ target: null, overlay: 'none' }, { type: 'openMenu', target: post });
}

describe('reducePostSafetyUi', () => {
  it('keeps the post and opens the report sheet when Report is selected', () => {
    const next = reducePostSafetyUi(menuOpen(), { type: 'selectReport' });
    assert.equal(next.target, post);
    assert.equal(next.overlay, 'report');
    assert.equal(isPostSafetyMenuVisible(next), false);
    assert.equal(isPostSafetyReportVisible(next), true);
  });

  it('keeps the post and opens the block sheet when Block is selected', () => {
    const next = reducePostSafetyUi(menuOpen(), { type: 'selectBlock' });
    assert.equal(next.target, post);
    assert.equal(isPostSafetyBlockVisible(next), true);
  });

  it('does not drop the post if the menu is dismissed while report is already open', () => {
    const reporting = reducePostSafetyUi(menuOpen(), { type: 'selectReport' });
    const next = reducePostSafetyUi(reporting, { type: 'dismissMenu' });
    assert.equal(next.target, post);
    assert.equal(next.overlay, 'report');
  });

  it('clears the post when the action menu is cancelled', () => {
    const next = reducePostSafetyUi(menuOpen(), { type: 'dismissMenu' });
    assert.equal(next.target, null);
    assert.equal(next.overlay, 'none');
  });

  it('clears the post after a successful report', () => {
    const reporting = reducePostSafetyUi(menuOpen(), { type: 'selectReport' });
    const next = reducePostSafetyUi(reporting, { type: 'completed' });
    assert.equal(next.target, null);
    assert.equal(isPostSafetyReportVisible(next), false);
  });

  it('ignores report selection when no post is targeted', () => {
    const next = reducePostSafetyUi({ target: null, overlay: 'none' }, { type: 'selectReport' });
    assert.equal(next.overlay, 'none');
    assert.equal(isPostSafetyReportVisible(next), false);
  });
});
