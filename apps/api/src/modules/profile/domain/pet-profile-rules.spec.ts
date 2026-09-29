import { ValidationError } from '../../../shared/domain/result';
import { AppTemperament } from '../../../shared/domain/types';
import { normalizePetUpdate } from './pet-profile-rules';

const now = new Date(Date.UTC(2026, 8, 26));

describe('normalizePetUpdate', () => {
  it('keeps a predefined temperament', () => {
    const next = normalizePetUpdate(
      { temperament: [AppTemperament.Calm], customTemperament: 'ignored' },
      now,
    );
    expect(next.temperament).toEqual([AppTemperament.Calm]);
    expect(next.customTemperament).toBeNull();
  });

  it('persists a custom temperament', () => {
    const next = normalizePetUpdate(
      { temperament: [AppTemperament.Custom], customTemperament: '  Goofy  ' },
      now,
    );
    expect(next.customTemperament).toBe('Goofy');
  });

  it('keeps the custom value when the profile is edited again', () => {
    const next = normalizePetUpdate(
      {
        name: 'Phoebe',
        temperament: [AppTemperament.Friendly, AppTemperament.Custom],
        customTemperament: 'Velvet',
      },
      now,
    );
    expect(next.name).toBe('Phoebe');
    expect(next.customTemperament).toBe('Velvet');
  });

  it('requires text when Custom is selected', () => {
    expect(() =>
      normalizePetUpdate(
        { temperament: [AppTemperament.Custom], customTemperament: '  ' },
        now,
      ),
    ).toThrow(ValidationError);
  });

  it('derives age from the birth date and rejects 17', () => {
    expect(normalizePetUpdate({ birthDate: '2018-01-01' }, now).age).toBe(8);
    expect(() => normalizePetUpdate({ age: 17 }, now)).toThrow(/0 and 16/);
    expect(() => normalizePetUpdate({ age: -1 }, now)).toThrow(/0 and 16/);
    expect(normalizePetUpdate({ age: 0 }, now).age).toBe(0);
    expect(normalizePetUpdate({ age: 16 }, now).age).toBe(16);
  });
});
