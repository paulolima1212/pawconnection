import {
  AppConnectionIntent,
  AppGender,
} from '../../../../shared/domain/types';

export const MAP_REPOSITORY = Symbol('MAP_REPOSITORY');

export type MapUserPin = {
  id: string;
  fullName: string;
  handle: string;
  photoUrl: string | null;
  ownerAge: number | null;
  ownerGender: AppGender;
  ownerBio: string | null;
  petName: string | null;
  petPhotoUrl: string | null;
  petBreed: string | null;
  petGender: AppGender;
  petBio: string | null;
  lookingFor: AppConnectionIntent[];
  latitude: number;
  longitude: number;
  locationUpdatedAt: Date | null;
};

export interface IMapRepository {
  updateUserLocation(
    userId: string,
    latitude: number,
    longitude: number,
  ): Promise<void>;

  listVisibleUsers(viewerId: string): Promise<MapUserPin[]>;
}
