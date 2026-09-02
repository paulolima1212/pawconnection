export const HANDLE_MIN_LENGTH = 3;
export const HANDLE_MAX_LENGTH = 20;
export const HANDLE_PATTERN = /^[a-z0-9_]+$/;

export function sanitizeHandleInput(raw: string): string {
  return raw.replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, HANDLE_MAX_LENGTH);
}

export function normalizeHandle(raw: string | null | undefined): string {
  return sanitizeHandleInput(raw ?? '');
}

export function isValidHandle(raw: string): boolean {
  const value = normalizeHandle(raw);
  return HANDLE_PATTERN.test(value) && value.length >= HANDLE_MIN_LENGTH;
}

export function displayHandle(raw: string | null | undefined): string {
  const value = normalizeHandle(raw);
  return value ? `@${value}` : '';
}
