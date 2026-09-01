import { apiRequest } from '@/lib/api/client';
import type { AuthResponse } from '@/lib/api/types';

export function register(input: { email: string; password: string; fullName: string }) {
  return apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: input });
}

export function login(input: { email: string; password: string }) {
  return apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: input });
}

export function requestPasswordReset(input: { email: string }) {
  return apiRequest<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: input,
  });
}

export function resetPassword(input: { token: string; password: string }) {
  return apiRequest<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: input,
  });
}

export function getAuthMe() {
  return apiRequest<{
    id: string;
    email?: string | null;
    fullName: string;
    handle: string;
    onboardingComplete: boolean;
  }>('/auth/me');
}
