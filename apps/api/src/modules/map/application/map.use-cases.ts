import { Inject, Injectable } from '@nestjs/common';
import {
  AppConnectionIntent,
  AppGender,
} from '../../../shared/domain/types';
import { ValidationError } from '../../../shared/domain/result';
import { haversineKm } from '../../../shared/infrastructure/mappers/prisma.mapper';
import { SupabaseService } from '../../../shared/infrastructure/supabase/supabase.service';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../profile/domain/repositories/user.repository';
import { MAP_REPOSITORY, IMapRepository, MapUserPin } from '../domain/repositories/map.repository';
import {
  USER_BLOCK_READER,
  IUserBlockReader,
} from '../../moderation/domain/ports/user-block-reader.port';
import { VisibleToViewerSpec } from '../../moderation/domain/specifications/hidden-user';

export type MapUserPinResponse = {
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
  distanceKm: number | null;
  locationUpdatedAt: string | null;
};

function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

@Injectable()
export class UpdateMapLocationUseCase {
  constructor(@Inject(MAP_REPOSITORY) private readonly map: IMapRepository) {}

  async execute(userId: string, latitude: number, longitude: number): Promise<{ ok: true }> {
    if (!isValidCoordinate(latitude, longitude)) {
      throw new ValidationError('Invalid coordinates');
    }
    await this.map.updateUserLocation(userId, latitude, longitude);
    return { ok: true };
  }
}

@Injectable()
export class ListMapUsersUseCase {
  constructor(
    @Inject(MAP_REPOSITORY) private readonly map: IMapRepository,
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(USER_BLOCK_READER) private readonly blocks: IUserBlockReader,
    private readonly supabase: SupabaseService,
  ) {}

  async execute(viewerId: string): Promise<MapUserPinResponse[]> {
    const viewer = await this.users.findById(viewerId);
    const pins = await this.map.listVisibleUsers(viewerId);
    const hidden = new VisibleToViewerSpec(
      new Set(await this.blocks.listHiddenUserIds(viewerId)),
    );
    return pins
      .filter((pin) => hidden.isSatisfiedBy(pin))
      .map((pin) => this.toResponse(pin, viewer?.latitude, viewer?.longitude));
  }

  private toResponse(
    pin: MapUserPin,
    viewerLat?: number | null,
    viewerLng?: number | null,
  ): MapUserPinResponse {
    const distanceKm =
      viewerLat != null &&
      viewerLng != null &&
      Number.isFinite(viewerLat) &&
      Number.isFinite(viewerLng)
        ? haversineKm(viewerLat, viewerLng, pin.latitude, pin.longitude)
        : null;

    return {
      id: pin.id,
      fullName: pin.fullName,
      handle: pin.handle,
      photoUrl: this.supabase.normalizePublicUrl(pin.photoUrl),
      ownerAge: pin.ownerAge,
      ownerGender: pin.ownerGender,
      ownerBio: pin.ownerBio,
      petName: pin.petName,
      petPhotoUrl: this.supabase.normalizePublicUrl(pin.petPhotoUrl),
      petBreed: pin.petBreed,
      petGender: pin.petGender,
      petBio: pin.petBio,
      lookingFor: pin.lookingFor,
      latitude: pin.latitude,
      longitude: pin.longitude,
      distanceKm,
      locationUpdatedAt: pin.locationUpdatedAt?.toISOString() ?? null,
    };
  }
}
