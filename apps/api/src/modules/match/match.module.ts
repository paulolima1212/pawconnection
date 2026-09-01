import { Module } from '@nestjs/common';
import { ConnectionsModule } from '../connections/connections.module';
import { ProfileModule } from '../profile/profile.module';
import { ModerationModule } from '../moderation/moderation.module';
import { SupabaseModule } from '../../shared/infrastructure/supabase/supabase.module';
import {
  ListMatchCandidatesUseCase,
  PassMatchCandidateUseCase,
  SendWaveUseCase,
} from './application/match.use-cases';
import { MatchCandidateMapper } from './application/match.mapper';
import { MatchController } from './presentation/match.controller';

@Module({
  imports: [ProfileModule, SupabaseModule, ConnectionsModule, ModerationModule],
  controllers: [MatchController],
  providers: [
    ListMatchCandidatesUseCase,
    PassMatchCandidateUseCase,
    SendWaveUseCase,
    MatchCandidateMapper,
  ],
})
export class MatchModule {}
