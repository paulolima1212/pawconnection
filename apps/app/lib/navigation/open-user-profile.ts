import type { Router } from 'expo-router';

export function normalizePublicHandle(handle: string | null | undefined): string {
  return (handle ?? '').trim().replace(/^@+/, '');
}

export function openUserProfile(router: Router, handle: string | null | undefined): boolean {
  const normalized = normalizePublicHandle(handle);
  if (!normalized) return false;
  router.push(`/user/${encodeURIComponent(normalized)}`);
  return true;
}
