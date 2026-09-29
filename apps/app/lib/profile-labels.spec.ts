import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatDeclarationStatus, formatTemperamentList } from './profile-labels';

describe('profile labels', () => {
  it('shows a friendly vaccination label', () => {
    assert.equal(formatDeclarationStatus('PreferNotToSay'), 'Prefer not to say');
    assert.equal(formatDeclarationStatus('Yes'), 'Yes');
    assert.equal(formatDeclarationStatus('No'), 'No');
  });

  it('shows the custom temperament text', () => {
    assert.equal(formatTemperamentList(['Calm', 'Custom'], 'Goofy'), 'Calm, Goofy');
  });
});
