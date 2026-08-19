import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../shared/infrastructure/supabase/supabase.module';
import { USER_REPOSITORY } from './domain/repositories/user.repository';
import { PET_REPOSITORY } from './domain/repositories/pet.repository';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { PrismaPetRepository } from './infrastructure/prisma-pet.repository';
import {
  CompleteOnboardingUseCase,
  GetMyProfileUseCase,
  GetPublicProfileByHandleUseCase,
  SetUserInterestsUseCase,
  SetUserLookingForUseCase,
  UpdateOwnerProfileUseCase,
  UpdatePetProfileUseCase,
} from './application/profile.use-cases';
import { ProfileController } from './presentation/profile.controller';

@Module({
  imports: [SupabaseModule],
  controllers: [ProfileController],
  providers: [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PET_REPOSITORY, useClass: PrismaPetRepository },
    GetMyProfileUseCase,
    GetPublicProfileByHandleUseCase,
    UpdateOwnerProfileUseCase,
    UpdatePetProfileUseCase,
    SetUserInterestsUseCase,
    SetUserLookingForUseCase,
    CompleteOnboardingUseCase,
  ],
  exports: [USER_REPOSITORY],
})
export class ProfileModule {}
