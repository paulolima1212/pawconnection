import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { localitySearchQuery } from './locality-search';

describe('locality search query', () => {
  it('waits for a city or neighborhood', () => {
    assert.equal(localitySearchQuery(''), null);
    assert.equal(localitySearchQuery(' S '), null);
  });

  it('trims and keeps a usable query', () => {
    assert.equal(localitySearchQuery('  São Gonçalo  '), 'São Gonçalo');
  });
});
