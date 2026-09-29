import { CUSTOM_TEMPERAMENT } from './profile-values';

export function formatDeclarationStatus(value: string | null | undefined): string {
  if (!value) return '';
  if (value === 'PreferNotToSay') return 'Prefer not to say';
  return value;
}

export function formatGender(value: string | null | undefined): string {
  if (!value) return '';
  return value;
}

export function formatTemperamentList(
  values: readonly string[] | string | null | undefined,
  custom?: string | null,
): string {
  const list = Array.isArray(values) ? values : values ? [values] : [];
  return list
    .map((value) =>
      value === CUSTOM_TEMPERAMENT ? custom?.trim() || 'Custom / Other' : value,
    )
    .join(', ');
}
