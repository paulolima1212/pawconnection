import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  customTemperamentError,
  customTemperamentForApi,
  declarationForApi,
  genderForApi,
  normalizeTemperamentList,
} from './profile-values';

describe('pet profile values', () => {
  it('keeps a predefined temperament', () => {
    assert.deepEqual(normalizeTemperamentList(['Calm']), ['Calm']);
    assert.equal(customTemperamentForApi(['Calm'], 'ignored'), undefined);
  });

  it('keeps a custom temperament', () => {
    assert.deepEqual(normalizeTemperamentList(['Custom']), ['Custom']);
    assert.equal(customTemperamentForApi(['Custom'], ' Goofy '), 'Goofy');
    assert.equal(customTemperamentError(['Custom'], 'Goofy'), null);
  });

  it('does not drop a custom value while editing', () => {
    assert.equal(
      customTemperamentForApi(['Friendly', 'Custom'], 'Velvet'),
      'Velvet',
    );
  });

  it('maps vaccination and desexed answers', () => {
    assert.equal(declarationForApi('Yes'), 'Yes');
    assert.equal(declarationForApi('No'), 'No');
    assert.equal(declarationForApi('PreferNotToSay'), 'PreferNotToSay');
    assert.equal(declarationForApi(''), undefined);
  });

  it('maps dog gender including Other', () => {
    assert.equal(genderForApi('Male'), 'Male');
    assert.equal(genderForApi('Female'), 'Female');
    assert.equal(genderForApi('Other'), 'Other');
  });
});
