import type { InterestId } from '@/context/profile-onboarding';
import type { GenderValue } from '@/context/profile-onboarding';

export type MatchCandidatePetApi = {
  name: string;
  age?: number | null;
  breed?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  photoUrls?: string[];
  gender?: GenderValue;
  temperament?: string;
  vaccinated?: string;
};

export type MatchCandidateUserApi = {
  id: string;
  fullName: string;
  handle: string;
  photoUrl?: string | null;
  petName?: string | null;
  petPhotoUrl?: string | null;
  location?: string | null;
  petAge?: number | null;
  petGender?: GenderValue | null;
  petBreed?: string | null;
};

export type MatchCandidateApi = {
  user: MatchCandidateUserApi;
  pet?: MatchCandidatePetApi | null;
  ownerAge?: number | null;
  ownerBio?: string | null;
  ownerPhotoUrls?: string[];
  lookingFor?: InterestId[] | string[];
  interests?: InterestId[] | string[];
  distanceKm?: number | null;
  sharedInterests?: string[];
  sharedLookingFor?: string[];
};

export type MatchCandidatesResponseApi = {
  radiusKm: number;
  candidates: MatchCandidateApi[];
};

export type MatchFeedFocus = 'pet' | 'owner';

export type MatchFeedCard = {
  id: string;
  handle: string;
  fullName: string;
  ownerFirstName: string;
  age: number | null;
  location: string | null;
  distanceKm: number | null;
  interests: string[];
  ownerBio: string;
  petBio: string;
  petName: string;
  petBreed: string;
  petGender: GenderValue;
  ownerPhotoUrls: string[];
  petPhotoUrls: string[];
};

export const MATCH_WAVE_DEFAULT_MESSAGE = '👋 Hi!';

export function mapCandidateToFeedCard(candidate: MatchCandidateApi): MatchFeedCard | null {
  if (!candidate.pet?.name) return null;

  const ownerPhotoUrls =
    candidate.ownerPhotoUrls?.filter(Boolean) ??
    (candidate.user.photoUrl ? [candidate.user.photoUrl] : []);
  const petPhotoUrls =
    candidate.pet.photoUrls?.filter(Boolean) ??
    (candidate.pet.photoUrl ? [candidate.pet.photoUrl] : []);

  const fullName = candidate.user.fullName;
  const interests = candidate.sharedInterests?.length
    ? candidate.sharedInterests
    : candidate.interests?.length
      ? candidate.interests.map(String)
      : (candidate.lookingFor ?? []).map(String);

  return {
    id: candidate.user.id,
    handle: candidate.user.handle.replace(/^@+/, ''),
    fullName,
    ownerFirstName: fullName.split(/\s+/)[0] || fullName,
    age: candidate.ownerAge ?? null,
    location: candidate.user.location ?? null,
    distanceKm: candidate.distanceKm ?? null,
    interests,
    ownerBio: (candidate.ownerBio?.trim() || 'No bio yet.').trim(),
    petBio: (candidate.pet.bio?.trim() || 'No bio yet.').trim(),
    petName: candidate.pet.name,
    petBreed: candidate.pet.breed?.trim() || 'Dog',
    petGender: candidate.pet.gender ?? 'Male',
    ownerPhotoUrls,
    petPhotoUrls,
  };
}

export function photosForFocus(card: MatchFeedCard, focus: MatchFeedFocus): string[] {
  return focus === 'pet' ? card.petPhotoUrls : card.ownerPhotoUrls;
}

export function avatarUriForFocus(card: MatchFeedCard, focus: MatchFeedFocus): string | null {
  const opposite = focus === 'pet' ? card.ownerPhotoUrls : card.petPhotoUrls;
  return opposite[0] ?? null;
}

export function bioForFocus(card: MatchFeedCard, focus: MatchFeedFocus): string {
  return focus === 'pet' ? card.petBio : card.ownerBio;
}

export function locationLabel(card: MatchFeedCard): string {
  if (card.location?.trim()) return card.location.trim();
  if (card.distanceKm != null) {
    const km = card.distanceKm < 10 ? card.distanceKm.toFixed(1) : Math.round(card.distanceKm).toString();
    return `${km} km away`;
  }
  return 'Nearby';
}
