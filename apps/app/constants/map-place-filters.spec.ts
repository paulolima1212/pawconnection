import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { radiusKmForPlacesRequest } from './map-place-filters';

describe('radiusKmForPlacesRequest', () => {
  it('omits worldwide so the API can default to 5 km', () => {
    assert.equal(radiusKmForPlacesRequest(''), undefined);
  });

  it('sends a positive radius from the distance chip', () => {
    assert.equal(radiusKmForPlacesRequest('10'), 10);
  });
});
