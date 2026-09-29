import { formatLocalityLabel } from './locality-label';
import { localityFromAddress } from './nominatim-locality';

describe('localityFromAddress', () => {
  it('builds a neighborhood suggestion', () => {
    const prediction = localityFromAddress({
      suburb: 'Santa Catarina',
      city: 'São Gonçalo',
      stateCode: 'RJ',
      country: 'Brasil',
    });
    expect(prediction).toEqual({
      mainText: 'Santa Catarina',
      secondaryText: 'São Gonçalo - RJ, Brasil',
    });
    expect(
      formatLocalityLabel(prediction!.mainText, prediction!.secondaryText),
    ).toBe('Santa Catarina, São Gonçalo - RJ - Brasil');
  });

  it('builds a city suggestion', () => {
    const prediction = localityFromAddress({
      city: 'São Gonçalo',
      stateCode: 'RJ',
      country: 'Brasil',
    });
    expect(
      formatLocalityLabel(prediction!.mainText, prediction!.secondaryText),
    ).toBe('São Gonçalo - RJ - Brasil');
  });

  it('ignores a result that is only a country', () => {
    expect(localityFromAddress({ country: 'Brasil' })).toBeNull();
  });

  it('uses the state name when the region code is numeric', () => {
    const prediction = localityFromAddress({
      city: 'São Gonçalo',
      state: 'Madeira',
      stateCode: '30',
      country: 'Portugal',
    });
    expect(
      formatLocalityLabel(prediction!.mainText, prediction!.secondaryText),
    ).toBe('São Gonçalo - Madeira - Portugal');
  });
});
