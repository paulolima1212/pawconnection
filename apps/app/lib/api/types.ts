import type {
  DesexedValue,
  GenderValue,
  InterestId,
  TemperamentValue,
  VaccinatedValue,
} from '@/context/profile-onboarding';

export type AuthResponse = {
  accessToken: string;
  user: {
    id: string;
    email?: string | null;
    fullName: string;
    handle: string;
    onboardingComplete: boolean;
  };
};

export type ProfileOwnerApi = {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  age?: number | null;
  gender?: GenderValue;
  location?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  photoUrls?: string[];
  latitude?: number | null;
  longitude?: number | null;
};

export type ProfilePetApi = {
  name: string;
  age?: number | null;
  birthDate?: string | null;
  breed?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  photoUrls?: string[];
  temperament?: TemperamentValue[];
  vaccinated?: VaccinatedValue;
  desexed?: DesexedValue;
  gender?: GenderValue;
  favoritesThings?: string | null;
  favoriteMeal?: string | null;
  enjoysPark?: boolean;
  enjoysWater?: boolean;
  enjoysWalks?: boolean;
};

export type ProfileMeResponse = {
  id?: string;
  onboardingComplete: boolean;
  interests: InterestId[] | string[];
  /** @deprecated Prefer interests for dog-owner goals */
  lookingFor?: InterestId[] | string[];
  handle: string;
  owner: ProfileOwnerApi;
  pet?: ProfilePetApi | null;
};

export type InboxRequestApi = {
  id: string;
  senderId: string;
  recipientId: string;
  type: 'romance' | 'friendship' | 'request';
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  sender?: {
    id: string;
    fullName: string;
    handle: string;
    photoUrl?: string | null;
    petName?: string | null;
    petPhotoUrl?: string | null;
  };
  recipient?: {
    id: string;
    fullName: string;
    handle: string;
    photoUrl?: string | null;
    petName?: string | null;
    petPhotoUrl?: string | null;
  };
};

export type FeedPostApi = {
  id: string;
  authorId: string;
  body?: string | null;
  imageUrls: string[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: string;
  author?: {
    id: string;
    fullName: string;
    handle: string;
    photoUrl?: string | null;
    petName?: string | null;
    petPhotoUrl?: string | null;
    location?: string | null;
    petAge?: number | null;
    petGender?: 'Male' | 'Female' | null;
    petBreed?: string | null;
  };
};

export type CommentAuthorApi = {
  id: string;
  fullName: string;
  handle: string;
  photoUrl?: string | null;
  petName?: string | null;
  petPhotoUrl?: string | null;
};

export type CommentStatusApi =
  | 'ACTIVE'
  | 'EDITED'
  | 'DELETED'
  | 'HIDDEN'
  | 'BLOCKED';

export type CommentApi = {
  id: string;
  postId: string;
  authorId: string;
  parentCommentId: string | null;
  content: string;
  status: CommentStatusApi;
  edited: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  replyCount: number;
  author: CommentAuthorApi | null;
};

export type CommentTreeApi = CommentApi & {
  replies: CommentApi[];
  hasMoreReplies: boolean;
};

export type CommentTreePageApi = {
  items: CommentTreeApi[];
  nextCursor: string | null;
};

export type CommentRepliesPageApi = {
  items: CommentApi[];
  nextCursor: string | null;
};

export type PostCommentCountApi = {
  postId: string;
  count: number;
};

export type MapUserPinApi = {
  id: string;
  fullName: string;
  handle: string;
  photoUrl?: string | null;
  ownerAge?: number | null;
  ownerGender?: GenderValue;
  ownerBio?: string | null;
  petName?: string | null;
  petPhotoUrl?: string | null;
  petBreed?: string | null;
  petGender?: GenderValue;
  petBio?: string | null;
  lookingFor?: InterestId[] | string[];
  interests?: InterestId[] | string[];
  latitude: number;
  longitude: number;
  distanceKm?: number | null;
  locationUpdatedAt?: string | null;
};
