import type { ProfileDraft, TemperamentValue } from '@/context/profile-onboarding';
import { resolveMediaUrl } from '@/lib/api/media';
import type { ProfileMeResponse } from '@/lib/api/types';

export function profileMeToDraft(dto: ProfileMeResponse, prev: ProfileDraft): ProfileDraft {
  const interestSet = new Set([
    'Friendship',
    'Dog friendly locations',
    'Dog services',
    'Dog playdates',
    'All the above',
  ]);
  const fromApi = (dto.interests ?? []).filter(
    (v): v is ProfileDraft['interests'][number] =>
      typeof v === 'string' && interestSet.has(v),
  ) as ProfileDraft['interests'];
  const interests: ProfileDraft['interests'] = fromApi.length > 0 ? fromApi : prev.interests;

  return {
    ...prev,
    interests,
    fullName: dto.owner.fullName ?? prev.fullName,
    email: dto.owner.email ?? prev.email,
    phone: dto.owner.phone ?? prev.phone,
    age: dto.owner.age != null ? String(dto.owner.age) : prev.age,
    humanGender: dto.owner.gender ?? prev.humanGender ?? '',
    location: dto.owner.location ?? prev.location,
    humanBio: dto.owner.bio ?? prev.humanBio,
    handle: (dto.handle ?? prev.handle ?? '').replace(/^@+/, ''),
    humanPhotoUri:
      resolveMediaUrl(dto.owner.photoUrl) ?? resolveMediaUrl(prev.humanPhotoUri),
    dogName: dto.pet?.name ?? prev.dogName,
    dogBirthday: dto.pet?.birthDate ?? prev.dogBirthday,
    dogAge: dto.pet?.age != null ? String(dto.pet.age) : prev.dogAge,
    breed: dto.pet?.breed ?? prev.breed,
    dogBio: dto.pet?.bio ?? prev.dogBio,
    dogPhotoUri:
      resolveMediaUrl(dto.pet?.photoUrl) ?? resolveMediaUrl(prev.dogPhotoUri),
    temperament: Array.isArray(dto.pet?.temperament)
      ? dto.pet.temperament
      : dto.pet?.temperament
        ? [dto.pet.temperament as TemperamentValue]
        : prev.temperament,
    vaccinated: dto.pet?.vaccinated ?? prev.vaccinated ?? '',
    desexed: dto.pet?.desexed ?? prev.desexed ?? '',
    dogGender: dto.pet?.gender ?? prev.dogGender ?? '',
    favoritesThings: dto.pet?.favoritesThings ?? prev.favoritesThings,
    favoriteMeal: dto.pet?.favoriteMeal ?? prev.favoriteMeal,
    dogEnjoysPark: dto.pet?.enjoysPark ?? prev.dogEnjoysPark,
    dogEnjoysWater: dto.pet?.enjoysWater ?? prev.dogEnjoysWater,
    dogEnjoysWalks: dto.pet?.enjoysWalks ?? prev.dogEnjoysWalks,
    dogEnjoysOthers:
      Boolean((dto.pet?.favoritesThings ?? prev.favoritesThings ?? '').trim()) ||
      prev.dogEnjoysOthers,
  };
}

export function draftToOwnerPayload(draft: ProfileDraft) {
  const age = draft.age.trim() ? Number.parseInt(draft.age, 10) : undefined;
  return {
    fullName: draft.fullName.trim() || undefined,
    email: draft.email.trim() || undefined,
    phone: draft.phone.trim() || undefined,
    age: Number.isFinite(age) ? age : undefined,
    gender: draft.humanGender || undefined,
    location: draft.location.trim() || undefined,
    bio: draft.humanBio.trim() || undefined,
    handle: draft.handle.trim() || undefined,
    photoUrl: draft.humanPhotoUri?.startsWith('http') ? draft.humanPhotoUri : undefined,
  };
}

export function draftToPetPayload(draft: ProfileDraft) {
  const birthday = draft.dogBirthday.trim() || undefined;
  const ageFromBirthday = birthday
    ? (() => {
        const [y, m, d] = birthday.split('-').map(Number);
        if (!y || !m || !d) return undefined;
        const now = new Date();
        let age = now.getFullYear() - y;
        if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1;
        return age >= 0 ? age : undefined;
      })()
    : undefined;
  const legacyAge = draft.dogAge.trim() ? Number.parseInt(draft.dogAge, 10) : undefined;
  return {
    name: draft.dogName.trim() || undefined,
    birthDate: birthday,
    age: ageFromBirthday ?? (Number.isFinite(legacyAge) ? legacyAge : undefined),
    breed: draft.breed.trim() || undefined,
    bio: draft.dogBio.trim() || undefined,
    photoUrl: draft.dogPhotoUri?.startsWith('http') ? draft.dogPhotoUri : undefined,
    temperament: draft.temperament,
    vaccinated: draft.vaccinated || undefined,
    desexed: draft.desexed || undefined,
    gender: draft.dogGender || undefined,
    favoritesThings: draft.dogEnjoysOthers
      ? draft.favoritesThings.trim() || undefined
      : '',
    favoriteMeal: draft.favoriteMeal.trim() || undefined,
    enjoysPark: draft.dogEnjoysPark,
    enjoysWater: draft.dogEnjoysWater,
    enjoysWalks: draft.dogEnjoysWalks,
  };
}
