import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import {
  mapConnectionIntentToApp,
  mapGenderToApp,
} from '../../../shared/infrastructure/mappers/prisma.mapper';
import { IMapRepository, MapUserPin } from '../domain/repositories/map.repository';

@Injectable()
export class PrismaMapRepository implements IMapRepository {
  constructor(private readonly prisma: PrismaService) {}

  async updateUserLocation(
    userId: string,
    latitude: number,
    longitude: number,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        latitude,
        longitude,
        locationUpdatedAt: new Date(),
      },
    });
  }

  async listVisibleUsers(viewerId: string): Promise<MapUserPin[]> {
    const users = await this.prisma.user.findMany({
      where: {
        id: { not: viewerId },
        onboardingComplete: true,
        latitude: { not: null },
        longitude: { not: null },
        pet: { isNot: null },
      },
      include: { pet: true, connectionIntents: true },
      take: 300,
      orderBy: { locationUpdatedAt: 'desc' },
    });

    return users
      .filter((user) => user.pet != null)
      .map((user) => ({
        id: user.id,
        fullName: user.fullName,
        handle: user.handle,
        photoUrl: user.photoUrl,
        ownerAge: user.age,
        ownerGender: mapGenderToApp(user.gender),
        ownerBio: user.bio,
        petName: user.pet!.name,
        petPhotoUrl: user.pet!.photoUrl,
        petBreed: user.pet!.breed,
        petGender: mapGenderToApp(user.pet!.gender),
        petBio: user.pet!.bio,
        lookingFor: user.connectionIntents.map((row) =>
          mapConnectionIntentToApp(row.intent),
        ),
        latitude: user.latitude as number,
        longitude: user.longitude as number,
        locationUpdatedAt: user.locationUpdatedAt,
      }));
  }
}
