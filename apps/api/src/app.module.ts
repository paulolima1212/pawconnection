import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './shared/presentation/health.controller';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';
import { SupabaseModule } from './shared/infrastructure/supabase/supabase.module';
import { EventsModule } from './shared/events/events.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProfileModule } from './modules/profile/profile.module';
import { ConnectionsModule } from './modules/connections/connections.module';
import { MatchModule } from './modules/match/match.module';
import { FeedModule } from './modules/feed/feed.module';
import { CommentsModule } from './modules/comments/comments.module';
import { MapModule } from './modules/map/map.module';
import { ChatModule } from './modules/chat/chat.module';
import { MediaModule } from './modules/media/media.module';
import { ModerationModule } from './modules/moderation/moderation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SupabaseModule,
    EventsModule,
    AuthModule,
    ProfileModule,
    ConnectionsModule,
    MatchModule,
    FeedModule,
    CommentsModule,
    MapModule,
    ChatModule,
    MediaModule,
    ModerationModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
