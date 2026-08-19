import {
  ConnectionRequest,
  ConnectionIntent,
  Desexed,
  Gender,
  Interest,
  Pet,
  Temperament,
  User,
  Vaccinated,
} from '@prisma/client';
import {
  AppConnectionIntent,
  AppDesexed,
  AppGender,
  AppInterest,
  AppTemperament,
  AppVaccinated,
  ConnectionRequestEntity,
  ConnectionTypeValue,
  PetProfile,
  RequestStatusValue,
  UserEntity,
  UserSummary,
} from '../../domain/types';

const interestToApp: Record<Interest, AppInterest> = {
  Friendship: AppInterest.Friendship,
  DogFriendlyLocations: AppInterest.DogFriendlyLocations,
  DogServices: AppInterest.DogServices,
  DogPlaydates: AppInterest.DogPlaydates,
  AllTheAbove: AppInterest.AllTheAbove,
};

const interestToPrisma: Record<AppInterest, Interest> = {
  [AppInterest.Friendship]: Interest.Friendship,
  [AppInterest.DogFriendlyLocations]: Interest.DogFriendlyLocations,
  [AppInterest.DogServices]: Interest.DogServices,
  [AppInterest.DogPlaydates]: Interest.DogPlaydates,
  [AppInterest.AllTheAbove]: Interest.AllTheAbove,
};

export function mapInterestToApp(interest: Interest): AppInterest {
  return interestToApp[interest];
}

export function mapInterestToPrisma(interest: AppInterest): Interest {
  return interestToPrisma[interest];
}

const connectionIntentToApp: Record<ConnectionIntent, AppConnectionIntent> = {
  Friendship: AppConnectionIntent.Friendship,
  Relationship: AppConnectionIntent.Relationship,
  CasualDating: AppConnectionIntent.CasualDating,
  MeetPeople: AppConnectionIntent.MeetPeople,
};

const connectionIntentToPrisma: Record<AppConnectionIntent, ConnectionIntent> = {
  [AppConnectionIntent.Friendship]: ConnectionIntent.Friendship,
  [AppConnectionIntent.Relationship]: ConnectionIntent.Relationship,
  [AppConnectionIntent.CasualDating]: ConnectionIntent.CasualDating,
  [AppConnectionIntent.MeetPeople]: ConnectionIntent.MeetPeople,
};

export function mapConnectionIntentToApp(intent: ConnectionIntent): AppConnectionIntent {
  return connectionIntentToApp[intent];
}

export function mapConnectionIntentToPrisma(intent: AppConnectionIntent): ConnectionIntent {
  return connectionIntentToPrisma[intent];
}

export function mapGenderToApp(gender: Gender): AppGender {
  return gender as AppGender;
}

export function mapGenderToPrisma(gender: AppGender): Gender {
  return gender as Gender;
}

export function mapTemperamentToApp(t: Temperament): AppTemperament {
  return t as AppTemperament;
}

export function mapTemperamentToPrisma(t: AppTemperament): Temperament {
  return t as Temperament;
}

export function mapTemperamentsToApp(values: Temperament[]): AppTemperament[] {
  return values.map(mapTemperamentToApp);
}

export function mapTemperamentsToPrisma(values: AppTemperament[]): Temperament[] {
  return values.map(mapTemperamentToPrisma);
}

export function mapVaccinatedToApp(v: Vaccinated): AppVaccinated {
  return v as AppVaccinated;
}

export function mapVaccinatedToPrisma(v: AppVaccinated): Vaccinated {
  return v as Vaccinated;
}

export function mapDesexedToApp(v: Desexed): AppDesexed {
  return v as AppDesexed;
}

export function mapDesexedToPrisma(v: AppDesexed): Desexed {
  return v as Desexed;
}

export function resolveGalleryUrls(
  primary: string | null | undefined,
  gallery: { url: string; sortOrder: number }[],
  max = 6,
): string[] {
  const sorted = [...gallery].sort((a, b) => a.sortOrder - b.sortOrder);
  const urls = sorted.map((row) => row.url).filter(Boolean);
  if (urls.length > 0) return urls.slice(0, max);
  if (primary) return [primary];
  return [];
}

export function mapPetToDomain(
  pet: Pet & { photos?: { url: string; sortOrder: number }[] },
): PetProfile {
  const photoUrls = resolveGalleryUrls(pet.photoUrl, pet.photos ?? []);
  return {
    name: pet.name,
    age: pet.age,
    birthDate: pet.birthDate ? pet.birthDate.toISOString().slice(0, 10) : null,
    breed: pet.breed,
    bio: pet.bio,
    photoUrl: photoUrls[0] ?? pet.photoUrl,
    photoUrls,
    temperament: mapTemperamentsToApp(pet.temperament),
    vaccinated: mapVaccinatedToApp(pet.vaccinated),
    desexed: mapDesexedToApp(pet.desexed),
    gender: mapGenderToApp(pet.gender),
    favoritesThings: pet.favoritesThings,
    favoriteMeal: pet.favoriteMeal,
    enjoysPark: pet.enjoysPark,
    enjoysWater: pet.enjoysWater,
    enjoysWalks: pet.enjoysWalks,
  };
}

export type UserWithRelations = User & {
  interests?: { interest: Interest }[];
  connectionIntents?: { intent: ConnectionIntent }[];
  photos?: { url: string; sortOrder: number }[];
  pet?: (Pet & { photos?: { url: string; sortOrder: number }[] }) | null;
};

export function mapUserToDomain(user: UserWithRelations): UserEntity {
  const photoUrls = resolveGalleryUrls(user.photoUrl, user.photos ?? []);
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    fullName: user.fullName,
    handle: user.handle,
    age: user.age,
    gender: mapGenderToApp(user.gender),
    location: user.location,
    latitude: user.latitude,
    longitude: user.longitude,
    bio: user.bio,
    photoUrl: photoUrls[0] ?? user.photoUrl,
    photoUrls,
    phone: user.phone,
    onboardingComplete: user.onboardingComplete,
    verified: user.verified,
    interests: (user.interests ?? []).map((i) => mapInterestToApp(i.interest)),
    lookingFor: (user.connectionIntents ?? []).map((i) =>
      mapConnectionIntentToApp(i.intent),
    ),
    pet: user.pet ? mapPetToDomain(user.pet) : null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function mapUserToSummary(user: UserWithRelations): UserSummary {
  return {
    id: user.id,
    fullName: user.fullName,
    handle: user.handle,
    photoUrl: user.photoUrl,
    petName: user.pet?.name ?? null,
    petPhotoUrl: user.pet?.photoUrl ?? null,
    location: user.location,
    petAge: user.pet?.age ?? null,
    petGender: user.pet ? mapGenderToApp(user.pet.gender) : null,
    petBreed: user.pet?.breed ?? null,
  };
}

export type ConnectionRequestWithRelations = ConnectionRequest & {
  sender?: UserWithRelations;
  recipient?: UserWithRelations;
};

export function mapConnectionRequestToDomain(
  request: ConnectionRequestWithRelations,
): ConnectionRequestEntity {
  return {
    id: request.id,
    senderId: request.senderId,
    recipientId: request.recipientId,
    type: request.type as ConnectionTypeValue,
    status: request.status as RequestStatusValue,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    sender: request.sender ? mapUserToSummary(request.sender) : undefined,
    recipient: request.recipient
      ? mapUserToSummary(request.recipient)
      : undefined,
  };
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
