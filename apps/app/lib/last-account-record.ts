export type LastAccount = {
  userId: string;
  email: string;
  displayName: string;
  photoUrl: string | null;
};

export function parseLastAccount(raw: string | null): LastAccount | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<LastAccount> & { password?: unknown };
    if (parsed.password != null) return null;
    if (!parsed.userId || !parsed.email || !parsed.displayName) return null;
    return {
      userId: parsed.userId,
      email: parsed.email,
      displayName: parsed.displayName,
      photoUrl: parsed.photoUrl ?? null,
    };
  } catch {
    return null;
  }
}

export function serializeLastAccount(account: LastAccount): string {
  const payload: LastAccount = {
    userId: account.userId,
    email: account.email.trim().toLowerCase(),
    displayName: account.displayName.trim(),
    photoUrl: account.photoUrl,
  };
  return JSON.stringify(payload);
}
