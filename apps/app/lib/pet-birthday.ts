/**
 * Pet birthday helpers (YYYY-MM-DD storage, DD/MM/YYYY display).
 *
 * TODO(backlog): birthday notifications for owner + friends —
 * see docs/backlog/pet-birthday-notifications.md
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Format stored ISO date (YYYY-MM-DD) as DD/MM/YYYY for inputs. */
export function formatBirthdayDisplay(iso: string | null | undefined): string {
  if (!iso) return '';
  const m = ISO_DATE.exec(iso.trim());
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/**
 * Normalize typed birthday text to YYYY-MM-DD when complete and valid.
 * Accepts DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD.
 */
export function parseBirthdayInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const iso = ISO_DATE.exec(trimmed);
  if (iso) {
    return isValidCalendarDate(+iso[1], +iso[2], +iso[3])
      ? `${iso[1]}-${iso[2]}-${iso[3]}`
      : null;
  }

  const dmy = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(trimmed);
  if (dmy) {
    const day = Number.parseInt(dmy[1], 10);
    const month = Number.parseInt(dmy[2], 10);
    const year = Number.parseInt(dmy[3], 10);
    if (!isValidCalendarDate(year, month, day)) return null;
    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return null;
}

/** Mask progressive typing toward DD/MM/YYYY (digits only). */
export function maskBirthdayTyping(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function ageFromBirthdayIso(iso: string | null | undefined, now = new Date()): number | undefined {
  if (!iso) return undefined;
  const m = ISO_DATE.exec(iso.trim());
  if (!m) return undefined;
  const year = +m[1];
  const month = +m[2];
  const day = +m[3];
  if (!isValidCalendarDate(year, month, day)) return undefined;

  let age = now.getFullYear() - year;
  const hadBirthday =
    now.getMonth() + 1 > month || (now.getMonth() + 1 === month && now.getDate() >= day);
  if (!hadBirthday) age -= 1;
  if (age < 0 || age > 40) return undefined;
  return age;
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (year < 1990 || year > new Date().getFullYear()) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}
