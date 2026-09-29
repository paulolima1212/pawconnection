import { ValidationError } from '../../../shared/domain/result';

export const DOG_MIN_AGE = 0;
export const DOG_MAX_AGE = 16;
export const OWNER_MIN_AGE = 1;
export const OWNER_MAX_AGE = 120;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export type CalendarDate = { year: number; month: number; day: number };

export function isValidCalendarDate(
  year: number,
  month: number,
  day: number,
): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const dt = new Date(Date.UTC(year, month - 1, day));
  return (
    dt.getUTCFullYear() === year &&
    dt.getUTCMonth() === month - 1 &&
    dt.getUTCDate() === day
  );
}

export function parseIsoDate(value: string): CalendarDate | null {
  const match = ISO_DATE.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!isValidCalendarDate(year, month, day)) return null;
  return { year, month, day };
}

/** Whole years completed as of `now`, using the UTC calendar date. */
export function ageOnUtcDate(date: CalendarDate, now = new Date()): number {
  let age = now.getUTCFullYear() - date.year;
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  if (month < date.month || (month === date.month && day < date.day)) age -= 1;
  return age;
}

export function isoFromCalendarDate(date: CalendarDate): string {
  const month = String(date.month).padStart(2, '0');
  const day = String(date.day).padStart(2, '0');
  return `${date.year}-${month}-${day}`;
}

export function assertDogBirthDate(iso: string, now = new Date()): number {
  const parsed = parseIsoDate(iso);
  if (!parsed) throw new ValidationError('Enter a valid date of birth.');
  const age = ageOnUtcDate(parsed, now);
  if (age < DOG_MIN_AGE) {
    throw new ValidationError('Date of birth cannot be in the future.');
  }
  if (age > DOG_MAX_AGE) {
    throw new ValidationError('Dog age must be between 0 and 16 years.');
  }
  return age;
}

export function assertDogAge(age: number): void {
  if (!Number.isInteger(age) || age < DOG_MIN_AGE || age > DOG_MAX_AGE) {
    throw new ValidationError('Dog age must be between 0 and 16 years.');
  }
}

export function assertOwnerBirthDate(iso: string, now = new Date()): number {
  const parsed = parseIsoDate(iso);
  if (!parsed) throw new ValidationError('Enter a valid date of birth.');
  const age = ageOnUtcDate(parsed, now);
  if (age < 0)
    throw new ValidationError('Date of birth cannot be in the future.');
  if (age < OWNER_MIN_AGE) {
    throw new ValidationError('Owner must be at least 1 year old.');
  }
  if (age > OWNER_MAX_AGE) {
    throw new ValidationError('Owner age must be 120 or under.');
  }
  return age;
}

export function assertOwnerAge(age: number): void {
  if (!Number.isInteger(age) || age < OWNER_MIN_AGE || age > OWNER_MAX_AGE) {
    throw new ValidationError('Owner age must be between 1 and 120.');
  }
}
