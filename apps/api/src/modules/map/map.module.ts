import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ProfileModule } from '../profile/profile.module';
import { ModerationModule } from '../moderation/moderation.module';
import { SupabaseModule } from '../../shared/infrastructure/supabase/supabase.module';
import { MAP_REPOSITORY } from './domain/repositories/map.repository';
import { PLACES_SEARCH } from './domain/ports/places-search.port';
import { PrismaMapRepository } from './infrastructure/prisma-map.repository';
import { GooglePlacesSearch } from './infrastructure/google-places.search';
import { GoogleLocalitySearch } from './infrastructure/google-locality.search';
import { NominatimLocalitySearch } from './infrastructure/nominatim-locality.search';
import { LocalitySearch } from './infrastructure/locality.search';
import { LOCALITY_SEARCH } from './domain/ports/locality-search.port';
import { ListDogFriendlyPlacesUseCase } from './application/list-dog-friendly-places.use-case';
import { SearchLocalitiesUseCase } from './application/search-localities.use-case';
import {
  ListMapUsersUseCase,
  UpdateMapLocationUseCase,
} from './application/map.use-cases';
import { MapController } from './presentation/map.controller';
import { LocalityController } from './presentation/locality.controller';

@Module({
  imports: [
    SupabaseModule,
    ProfileModule,
    ModerationModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
  ],
  controllers: [MapController, LocalityController],
  providers: [
    { provide: MAP_REPOSITORY, useClass: PrismaMapRepository },
    { provide: PLACES_SEARCH, useClass: GooglePlacesSearch },
    GoogleLocalitySearch,
    NominatimLocalitySearch,
    { provide: LOCALITY_SEARCH, useClass: LocalitySearch },
    UpdateMapLocationUseCase,
    ListMapUsersUseCase,
    ListDogFriendlyPlacesUseCase,
    SearchLocalitiesUseCase,
  ],
})
export class MapModule {}
