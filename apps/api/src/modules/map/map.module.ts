import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ProfileModule } from '../profile/profile.module';
import { ModerationModule } from '../moderation/moderation.module';
import { SupabaseModule } from '../../shared/infrastructure/supabase/supabase.module';
import { MAP_REPOSITORY } from './domain/repositories/map.repository';
import { PLACES_SEARCH } from './domain/ports/places-search.port';
import { PrismaMapRepository } from './infrastructure/prisma-map.repository';
import { GooglePlacesSearch } from './infrastructure/google-places.search';
import { ListDogFriendlyPlacesUseCase } from './application/list-dog-friendly-places.use-case';
import {
  ListMapUsersUseCase,
  UpdateMapLocationUseCase,
} from './application/map.use-cases';
import { MapController } from './presentation/map.controller';

@Module({
  imports: [
    SupabaseModule,
    ProfileModule,
    ModerationModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
  ],
  controllers: [MapController],
  providers: [
    { provide: MAP_REPOSITORY, useClass: PrismaMapRepository },
    { provide: PLACES_SEARCH, useClass: GooglePlacesSearch },
    UpdateMapLocationUseCase,
    ListMapUsersUseCase,
    ListDogFriendlyPlacesUseCase,
  ],
})
export class MapModule {}
