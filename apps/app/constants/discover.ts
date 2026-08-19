import type { GenderValue, InterestId } from '@/context/profile-onboarding';
import type { MapUserPinApi } from '@/lib/api/types';
import { isHttpUrl } from '@/lib/api/media';

export type DiscoverPetGender = 'Male' | 'Female';

export type DiscoverPerson = {
  id: string;
  handle: string;
  fullName: string;
  ownerName: string;
  age: number | null;
  avatarUri: string;
  petName: string;
  petBreed: string;
  bio: string;
  breedTag: string;
  petGender: DiscoverPetGender;
  ownerGender: GenderValue;
  interests: InterestId[];
  distanceKm: number | null;
};

export const DISCOVER_AGE_FILTER_OPTIONS = [
  { value: '18-25', label: '18-25' },
  { value: '26-35', label: '26-35' },
  { value: '36-45', label: '36-45' },
  { value: 'any', label: 'Any age' },
] as const;

export type DiscoverAgeFilter = (typeof DISCOVER_AGE_FILTER_OPTIONS)[number]['value'];

export const DISCOVER_PET_TYPE_FILTER_OPTIONS = [
  { value: 'dogs', label: 'Dogs' },
  { value: 'all', label: 'All pets' },
] as const;

export type DiscoverPetTypeFilter = (typeof DISCOVER_PET_TYPE_FILTER_OPTIONS)[number]['value'];

export const DISCOVER_DISTANCE_FILTER_OPTIONS = [
  { value: '5', label: '+ 5 km' },
  { value: '10', label: '+ 10 km' },
  { value: '25', label: '+ 25 km' },
  { value: '50', label: '+ 50 km' },
] as const;

export type DiscoverDistanceFilter = (typeof DISCOVER_DISTANCE_FILTER_OPTIONS)[number]['value'];

export type DiscoverAdvancedFilters = {
  ownerGender: GenderValue | 'any';
  petGender: GenderValue | 'any';
  interest: InterestId | 'any';
};

export const DEFAULT_DISCOVER_ADVANCED_FILTERS: DiscoverAdvancedFilters = {
  ownerGender: 'any',
  petGender: 'any',
  interest: 'any',
};

function pinInterests(pin: MapUserPinApi): InterestId[] {
  const raw = pin.interests ?? pin.lookingFor ?? [];
  return raw.filter((v): v is InterestId => typeof v === 'string') as InterestId[];
}

export function mapPinToDiscoverPerson(pin: MapUserPinApi): DiscoverPerson | null {
  if (!pin.petName) return null;

  const avatar =
    (isHttpUrl(pin.photoUrl) && pin.photoUrl) ||
    (isHttpUrl(pin.petPhotoUrl) && pin.petPhotoUrl) ||
    '';

  const bio = (pin.petBio?.trim() || pin.ownerBio?.trim() || '').trim();
  const breed = pin.petBreed?.trim() || 'Dog';

  return {
    id: pin.id,
    handle: pin.handle,
    fullName: pin.fullName,
    ownerName: pin.fullName.split(/\s+/)[0] || pin.fullName,
    age: pin.ownerAge ?? null,
    avatarUri: avatar,
    petName: pin.petName,
    petBreed: breed,
    bio: bio || 'No bio yet.',
    breedTag: breed,
    petGender: (pin.petGender ?? 'Male') as DiscoverPetGender,
    ownerGender: pin.ownerGender ?? 'Male',
    interests: pinInterests(pin),
    distanceKm: pin.distanceKm ?? null,
  };
}

function personMatchesAge(person: DiscoverPerson, ageFilter: DiscoverAgeFilter): boolean {
  if (ageFilter === 'any') return true;
  if (person.age == null) return false;
  const [min, max] = ageFilter.split('-').map(Number);
  return person.age >= min && person.age <= max;
}

function personMatchesDistance(
  person: DiscoverPerson,
  distanceFilter: DiscoverDistanceFilter,
): boolean {
  if (person.distanceKm == null) return true;
  return person.distanceKm <= Number(distanceFilter);
}

function personMatchesAdvanced(
  person: DiscoverPerson,
  advanced: DiscoverAdvancedFilters,
): boolean {
  if (advanced.ownerGender !== 'any' && person.ownerGender !== advanced.ownerGender) {
    return false;
  }
  if (advanced.petGender !== 'any' && person.petGender !== advanced.petGender) {
    return false;
  }
  if (advanced.interest !== 'any' && !person.interests.includes(advanced.interest)) {
    return false;
  }
  return true;
}

export function filterDiscoverPeople(
  people: DiscoverPerson[],
  query: string,
  ageFilter: DiscoverAgeFilter,
  petTypeFilter: DiscoverPetTypeFilter,
  distanceFilter: DiscoverDistanceFilter,
  advanced: DiscoverAdvancedFilters,
  excludedIds: ReadonlySet<string>,
): DiscoverPerson[] {
  const q = query.trim().toLowerCase();
  return people.filter((person) => {
    if (excludedIds.has(person.id)) return false;
    if (!personMatchesAge(person, ageFilter)) return false;
    if (petTypeFilter === 'dogs' && !person.petName) return false;
    if (!personMatchesDistance(person, distanceFilter)) return false;
    if (!personMatchesAdvanced(person, advanced)) return false;
    if (!q) return true;
    const haystack = [person.fullName, person.ownerName, person.petName]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}
