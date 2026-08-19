import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import {
  mapDesexedToPrisma,
  mapGenderToPrisma,
  mapPetToDomain,
  mapTemperamentsToPrisma,
  mapVaccinatedToPrisma,
} from '../../../shared/infrastructure/mappers/prisma.mapper';
import {
  AppDesexed,
  AppGender,
  AppTemperament,
  AppVaccinated,
  PetProfile,
} from '../../../shared/domain/types';
import { IPetRepository } from '../domain/repositories/pet.repository';

function parseBirthDate(value?: string | null): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const day = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return undefined;
  const date = new Date(`${day}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function ageFromBirthDate(birthDate: Date, now = new Date()): number {
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
  const month = now.getUTCMonth() - birthDate.getUTCMonth();
  if (month < 0 || (month === 0 && now.getUTCDate() < birthDate.getUTCDate())) {
    age -= 1;
  }
  return Math.max(0, age);
}

@Injectable()
export class PrismaPetRepository implements IPetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(
    userId: string,
    data: Partial<PetProfile> & { name?: string },
  ): Promise<PetProfile> {
    const birthDate = parseBirthDate(data.birthDate);
    const derivedAge =
      birthDate instanceof Date ? ageFromBirthDate(birthDate) : undefined;
    const age = derivedAge ?? data.age;

    const pet = await this.prisma.pet.upsert({
      where: { userId },
      create: {
        userId,
        name: data.name ?? 'My Dog',
        age,
        birthDate: birthDate === undefined ? undefined : birthDate,
        breed: data.breed,
        bio: data.bio,
        photoUrl: data.photoUrl,
        temperament:
          data.temperament !== undefined
            ? mapTemperamentsToPrisma(data.temperament as AppTemperament[])
            : undefined,
        vaccinated: data.vaccinated
          ? mapVaccinatedToPrisma(data.vaccinated as AppVaccinated)
          : undefined,
        desexed: data.desexed
          ? mapDesexedToPrisma(data.desexed as AppDesexed)
          : undefined,
        gender: data.gender
          ? mapGenderToPrisma(data.gender as AppGender)
          : undefined,
        favoritesThings: data.favoritesThings,
        favoriteMeal: data.favoriteMeal,
        enjoysPark: data.enjoysPark,
        enjoysWater: data.enjoysWater,
        enjoysWalks: data.enjoysWalks,
      },
      update: {
        name: data.name,
        age,
        ...(birthDate !== undefined ? { birthDate } : {}),
        breed: data.breed,
        bio: data.bio,
        photoUrl: data.photoUrl,
        temperament:
          data.temperament !== undefined
            ? mapTemperamentsToPrisma(data.temperament as AppTemperament[])
            : undefined,
        vaccinated: data.vaccinated
          ? mapVaccinatedToPrisma(data.vaccinated as AppVaccinated)
          : undefined,
        desexed: data.desexed
          ? mapDesexedToPrisma(data.desexed as AppDesexed)
          : undefined,
        gender: data.gender
          ? mapGenderToPrisma(data.gender as AppGender)
          : undefined,
        favoritesThings: data.favoritesThings,
        favoriteMeal: data.favoriteMeal,
        enjoysPark: data.enjoysPark,
        enjoysWater: data.enjoysWater,
        enjoysWalks: data.enjoysWalks,
      },
    });
    return mapPetToDomain(pet);
  }
}
