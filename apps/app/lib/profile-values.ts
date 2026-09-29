export type GenderValue = 'Male' | 'Female' | 'Other';

export const TEMPERAMENT_OPTIONS = [
  'Happy',
  'Calm',
  'Playful',
  'Energetic',
  'Shy',
  'Friendly',
  'Custom',
] as const;

export type TemperamentValue = (typeof TEMPERAMENT_OPTIONS)[number];

export const CUSTOM_TEMPERAMENT = 'Custom' as const;
export const CUSTOM_TEMPERAMENT_MAX = 40;

export type VaccinatedValue = 'Yes' | 'No' | 'PreferNotToSay';
export type DesexedValue = 'Yes' | 'No' | 'PreferNotToSay';

export const TEMPERAMENT_DROPDOWN_OPTIONS: { value: TemperamentValue; label: string }[] =
  TEMPERAMENT_OPTIONS.map((value) => ({
    value,
    label: value === 'Custom' ? 'Custom / Other' : value,
  }));

export const VACCINATED_OPTIONS: { value: VaccinatedValue; label: string }[] = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
  { value: 'PreferNotToSay', label: 'Prefer not to say' },
];

export const DESEXED_OPTIONS: { value: DesexedValue; label: string }[] = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
  { value: 'PreferNotToSay', label: 'Prefer not to say' },
];

export const GENDER_OPTIONS: { value: GenderValue; label: string }[] = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

export function normalizeGenderOptional(raw: unknown): GenderValue | '' {
  const g = typeof raw === 'string' ? raw.trim() : '';
  if (!g) return '';
  if (g === 'Male' || g === 'male' || g === 'M' || g === 'Homem') return 'Male';
  if (g === 'Female' || g === 'female' || g === 'F' || g === 'Mulher') return 'Female';
  if (g === 'Other' || g === 'other' || g === 'Outro') return 'Other';
  return '';
}

export function genderForApi(raw: GenderValue | ''): GenderValue | undefined {
  if (raw === 'Male' || raw === 'Female' || raw === 'Other') return raw;
  return undefined;
}

export function normalizeTemperamentList(raw: unknown): TemperamentValue[] {
  const list = Array.isArray(raw) ? raw : raw != null && raw !== '' ? [raw] : [];
  const out: TemperamentValue[] = [];
  for (const item of list) {
    const s = typeof item === 'string' ? item.trim() : '';
    if (!s) continue;
    const found = TEMPERAMENT_OPTIONS.find((option) => option.toLowerCase() === s.toLowerCase());
    if (found && !out.includes(found)) out.push(found);
  }
  return out;
}

export function normalizeVaccinatedOptional(raw: unknown): VaccinatedValue | '' {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (!s) return '';
  if (s === 'prefernottosay' || s === 'prefer not to say' || s === 'not_declared') {
    return 'PreferNotToSay';
  }
  if (s === 'no' || s === 'n' || s === 'false' || s === 'não' || s === 'nao') return 'No';
  if (s === 'yes' || s === 'y' || s === 'true' || s === 'sim') return 'Yes';
  return '';
}

export function normalizeDesexedOptional(raw: unknown): DesexedValue | '' {
  return normalizeVaccinatedOptional(raw);
}

export function declarationForApi<T extends VaccinatedValue>(raw: T | ''): T | undefined {
  if (raw === 'Yes' || raw === 'No' || raw === 'PreferNotToSay') return raw as T;
  return undefined;
}

export function customTemperamentForApi(
  temperament: readonly TemperamentValue[],
  custom: string,
): string | undefined {
  if (!temperament.includes(CUSTOM_TEMPERAMENT)) return undefined;
  const text = custom.trim();
  return text || undefined;
}

export function customTemperamentError(
  temperament: readonly TemperamentValue[],
  custom: string,
): string | null {
  if (!temperament.includes(CUSTOM_TEMPERAMENT)) return null;
  const text = custom.trim();
  if (!text) return 'Enter a custom temperament.';
  if (text.length > CUSTOM_TEMPERAMENT_MAX) {
    return `Custom temperament must be ${CUSTOM_TEMPERAMENT_MAX} characters or fewer.`;
  }
  return null;
}
