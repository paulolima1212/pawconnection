import { PetProfile } from '../../../../shared/domain/types';

export const PET_REPOSITORY = Symbol('PET_REPOSITORY');

export interface IPetRepository {
  upsert(userId: string, data: Partial<PetProfile> & { name?: string }): Promise<PetProfile>;
}
