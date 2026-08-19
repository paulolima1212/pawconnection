import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module';
import { SupabaseModule } from '../../shared/infrastructure/supabase/supabase.module';
import { MAP_REPOSITORY } from './domain/repositories/map.repository';
import { PrismaMapRepository } from './infrastructure/prisma-map.repository';
import {
  ListMapUsersUseCase,
  UpdateMapLocationUseCase,
} from './application/map.use-cases';
import { MapController } from './presentation/map.controller';

@Module({
  imports: [SupabaseModule, ProfileModule],
  controllers: [MapController],
  providers: [
    { provide: MAP_REPOSITORY, useClass: PrismaMapRepository },
    UpdateMapLocationUseCase,
    ListMapUsersUseCase,
  ],
})
export class MapModule {}
