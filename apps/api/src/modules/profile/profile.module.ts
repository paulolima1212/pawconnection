import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { SupabaseModule } from '../../shared/infrastructure/supabase/supabase.module';
import { EVENT_BUS, IEventBus } from '../../shared/events/event-bus';
import { USER_REPOSITORY } from './domain/repositories/user.repository';
import { PET_REPOSITORY } from './domain/repositories/pet.repository';
import { ACCOUNT_MEDIA_CLEANER } from './domain/ports/account-media-cleaner.port';
import { PROFILE_EVENTS } from './domain/events/profile-events';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { PrismaPetRepository } from './infrastructure/prisma-pet.repository';
import { SupabaseAccountMediaCleaner } from './infrastructure/supabase-account-media-cleaner';
import { AccountDeletedAnalyticsHandler } from './infrastructure/handlers/account-deleted-analytics.handler';
import { DeleteAccountUseCase } from './application/delete-account.use-case';
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
    { provide: ACCOUNT_MEDIA_CLEANER, useClass: SupabaseAccountMediaCleaner },
    GetMyProfileUseCase,
    GetPublicProfileByHandleUseCase,
    UpdateOwnerProfileUseCase,
    UpdatePetProfileUseCase,
    SetUserInterestsUseCase,
    SetUserLookingForUseCase,
    CompleteOnboardingUseCase,
    DeleteAccountUseCase,
    AccountDeletedAnalyticsHandler,
  ],
  exports: [USER_REPOSITORY],
})
export class ProfileModule implements OnModuleInit {
  constructor(
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
    private readonly accountDeletedAnalytics: AccountDeletedAnalyticsHandler,
  ) {}

  onModuleInit(): void {
    this.bus.subscribe(
      PROFILE_EVENTS.ACCOUNT_DELETED,
      this.accountDeletedAnalytics,
    );
  }
}
