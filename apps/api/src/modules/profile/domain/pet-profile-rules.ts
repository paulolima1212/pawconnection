import { ValidationError } from '../../../shared/domain/result';
import { AppTemperament, PetProfile } from '../../../shared/domain/types';
import { assertDogAge, assertDogBirthDate } from './birth-date';

export const CUSTOM_TEMPERAMENT_MAX = 40;

export function assertCustomTemperament(
  temperament: AppTemperament[] | undefined,
  customTemperament: string | null | undefined,
): string | null | undefined {
  if (temperament === undefined) return customTemperament;
  const selected = temperament.includes(AppTemperament.Custom);
  const text = customTemperament?.trim() ?? '';
  if (!selected) return null;
  if (!text) throw new ValidationError('Enter a custom temperament.');
  if (text.length > CUSTOM_TEMPERAMENT_MAX) {
    throw new ValidationError(
      `Custom temperament must be ${CUSTOM_TEMPERAMENT_MAX} characters or fewer.`,
    );
  }
  return text;
}

/**
 * Birth date is the source of truth for dog age when present.
 * A standalone age must already be inside 0–16. Values are never clamped.
 */
export function normalizePetUpdate(
  data: Partial<PetProfile> & { name?: string },
  now = new Date(),
): Partial<PetProfile> & { name?: string } {
  const next: Partial<PetProfile> & { name?: string } = { ...data };

  if (typeof data.birthDate === 'string' && data.birthDate.trim()) {
    next.birthDate = data.birthDate.trim().slice(0, 10);
    next.age = assertDogBirthDate(next.birthDate, now);
  } else if (data.age != null) {
    assertDogAge(data.age);
    next.age = data.age;
  }

  if (data.temperament !== undefined) {
    next.customTemperament = assertCustomTemperament(
      data.temperament,
      data.customTemperament,
    );
  }

  return next;
}
