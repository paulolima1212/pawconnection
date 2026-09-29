import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import {
  mapDesexedToPrisma,
  mapGenderToPrisma,
  mapPetToDomain,
  mapTemperamentsToPrisma,
  mapVaccinatedToPrisma,
} from '../../../shared/infrastructure/mappers/prisma.mapper';
import { PetProfile } from '../../../shared/domain/types';
import { ageOnUtcDate, parseIsoDate } from '../domain/birth-date';
import { IPetRepository } from '../domain/repositories/pet.repository';

function parseBirthDate(value?: string | null): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const parsed = parseIsoDate(value.slice(0, 10));
  if (!parsed) return undefined;
  return new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
}

function ageFromBirthDate(birthDate: Date, now = new Date()): number {
  return ageOnUtcDate(
    {
      year: birthDate.getUTCFullYear(),
      month: birthDate.getUTCMonth() + 1,
      day: birthDate.getUTCDate(),
    },
    now,
  );
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
            ? mapTemperamentsToPrisma(data.temperament)
            : undefined,
        vaccinated: data.vaccinated
          ? mapVaccinatedToPrisma(data.vaccinated)
          : undefined,
        desexed: data.desexed ? mapDesexedToPrisma(data.desexed) : undefined,
        gender: data.gender ? mapGenderToPrisma(data.gender) : undefined,
        customTemperament: data.customTemperament,
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
            ? mapTemperamentsToPrisma(data.temperament)
            : undefined,
        vaccinated: data.vaccinated
          ? mapVaccinatedToPrisma(data.vaccinated)
          : undefined,
        desexed: data.desexed ? mapDesexedToPrisma(data.desexed) : undefined,
        gender: data.gender ? mapGenderToPrisma(data.gender) : undefined,
        customTemperament: data.customTemperament,
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
