import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../shared/infrastructure/supabase/supabase.module';
import { MediaController } from './presentation/media.controller';

@Module({
  imports: [SupabaseModule],
  controllers: [MediaController],
})
export class MediaModule {}
