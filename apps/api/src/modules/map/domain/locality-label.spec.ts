import { formatLocalityLabel } from './locality-label';

describe('formatLocalityLabel', () => {
  it('completes a neighborhood with city, state, and country', () => {
    expect(
      formatLocalityLabel('Santa Catarina', 'São Gonçalo - RJ, Brasil'),
    ).toBe('Santa Catarina, São Gonçalo - RJ - Brasil');
  });

  it('completes a city with state and country', () => {
    expect(formatLocalityLabel('São Gonçalo', 'RJ, Brasil')).toBe(
      'São Gonçalo - RJ - Brasil',
    );
  });

  it('keeps a label that has no secondary text', () => {
    expect(formatLocalityLabel('Sydney', null)).toBe('Sydney');
  });
});
