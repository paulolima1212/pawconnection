/** Trim and lowercase so login matches the address the owner typed. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
