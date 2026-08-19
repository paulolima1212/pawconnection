export function handleFromFullName(fullName: string): string {
  const base =
    fullName.trim().toLowerCase().replace(/\s+/g, '') || 'walkingphoebe';
  return base;
}

export enum AppInterest {
  Friendship = 'Friendship',
  DogFriendlyLocations = 'Dog friendly locations',
  DogServices = 'Dog services',
  DogPlaydates = 'Dog playdates',
  AllTheAbove = 'All the above',
}

/** @deprecated Prefer AppInterest for onboarding. Kept for connection request DTO compat. */
export enum AppConnectionIntent {
  Friendship = 'Friendship',
  Relationship = 'Relationship',
  CasualDating = 'Casual dating',
  MeetPeople = 'Meet people',
}

export enum AppGender {
  Male = 'Male',
  Female = 'Female',
}

export enum AppTemperament {
  Happy = 'Happy',
  Calm = 'Calm',
  Playful = 'Playful',
  Energetic = 'Energetic',
  Shy = 'Shy',
  Friendly = 'Friendly',
}

export enum AppVaccinated {
  Yes = 'Yes',
  No = 'No',
}

/** Australian English: desexed (neutered/spayed). */
export enum AppDesexed {
  Yes = 'Yes',
  No = 'No',
}

export type ConnectionTypeValue = 'romance' | 'friendship' | 'request';
export type RequestStatusValue = 'pending' | 'accepted' | 'rejected';
export type RequestDirection = 'incoming' | 'outgoing';

export interface OwnerProfile {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  age?: number | null;
  gender: AppGender;
  location?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface PetProfile {
  name: string;
  age?: number | null;
  /** ISO date YYYY-MM-DD (UTC midnight representation). */
  birthDate?: string | null;
  breed?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  photoUrls?: string[];
  temperament: AppTemperament[];
  vaccinated: AppVaccinated;
  desexed: AppDesexed;
  gender: AppGender;
  favoritesThings?: string | null;
  favoriteMeal?: string | null;
  enjoysPark: boolean;
  enjoysWater: boolean;
  enjoysWalks: boolean;
}

export interface UserEntity {
  id: string;
  email?: string | null;
  passwordHash?: string | null;
  fullName: string;
  handle: string;
  age?: number | null;
  gender: AppGender;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  bio?: string | null;
  photoUrl?: string | null;
  photoUrls?: string[];
  phone?: string | null;
  onboardingComplete: boolean;
  verified: boolean;
  interests: AppInterest[];
  lookingFor: AppConnectionIntent[];
  pet?: PetProfile | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectionRequestEntity {
  id: string;
  senderId: string;
  recipientId: string;
  type: ConnectionTypeValue;
  status: RequestStatusValue;
  createdAt: Date;
  updatedAt: Date;
  sender?: UserSummary;
  recipient?: UserSummary;
}

export interface UserSummary {
  id: string;
  fullName: string;
  handle: string;
  photoUrl?: string | null;
  petName?: string | null;
  petPhotoUrl?: string | null;
  location?: string | null;
  petAge?: number | null;
  petGender?: AppGender | null;
  petBreed?: string | null;
}

export interface PostEntity {
  id: string;
  authorId: string;
  body?: string | null;
  imageUrls: string[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: Date;
  updatedAt: Date;
  author?: UserSummary;
}

export interface CommentEntity {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: Date;
  author?: UserSummary;
}

export interface MatchCandidate {
  user: UserSummary;
  pet?: PetProfile | null;
  ownerAge?: number | null;
  ownerBio?: string | null;
  ownerPhotoUrls?: string[];
  lookingFor: AppConnectionIntent[];
  distanceKm?: number | null;
  sharedInterests: AppInterest[];
  sharedLookingFor: AppConnectionIntent[];
}

export type MatchCandidatesResult = {
  candidates: MatchCandidate[];
  radiusKm: number;
};
