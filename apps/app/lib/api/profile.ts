import type { InterestId } from '@/context/profile-onboarding';
import { ApiError, apiRequest } from '@/lib/api/client';
import type { ProfileMeResponse } from '@/lib/api/types';

export function getMyProfile() {
  return apiRequest<ProfileMeResponse>('/profile/me');
}

export function getPublicProfile(handle: string) {
  return apiRequest<ProfileMeResponse>(
    `/profile/public/${encodeURIComponent(handle)}`,
  );
}

export async function updateInterests(interests: InterestId[]) {
  try {
    return await apiRequest<ProfileMeResponse>('/profile/me/interests', {
      method: 'PUT',
      body: { interests },
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

/** @deprecated Use updateInterests */
export function updateLookingFor(interests: InterestId[]) {
  return updateInterests(interests);
}

export function updateOwner(body: Record<string, unknown>) {
  return apiRequest<ProfileMeResponse>('/profile/me/owner', {
    method: 'PATCH',
    body,
  });
}

export function updatePet(body: Record<string, unknown>) {
  return apiRequest<ProfileMeResponse>('/profile/me/pet', {
    method: 'PATCH',
    body,
  });
}

export function completeOnboardingRemote() {
  return apiRequest<ProfileMeResponse>('/profile/me/onboarding/complete', {
    method: 'POST',
  });
}

export function deleteMyAccount() {
  return apiRequest<null>('/profile/me', {
    method: 'DELETE',
  });
}
