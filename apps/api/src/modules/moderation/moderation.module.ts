import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { SupabaseModule } from '../../shared/infrastructure/supabase/supabase.module';
import { EVENT_BUS, IEventBus } from '../../shared/events/event-bus';
import { MODERATION_EVENTS } from './domain/events/moderation-events';
import { POST_REPORT_REPOSITORY } from './domain/repositories/post-report.repository';
import { USER_BLOCK_REPOSITORY } from './domain/repositories/user-block.repository';
import { USER_BLOCK_READER } from './domain/ports/user-block-reader.port';
import { MODERATION_USER_READER } from './domain/ports/user-reader.port';
import { MODERATION_POST_READER } from './domain/ports/post-reader.port';
import { PrismaPostReportRepository } from './infrastructure/prisma-post-report.repository';
import { PrismaUserBlockRepository } from './infrastructure/prisma-user-block.repository';
import { PrismaUserBlockReader } from './infrastructure/prisma-user-block-reader';
import { PrismaModerationUserReader } from './infrastructure/prisma-user-reader';
import { PrismaModerationPostReader } from './infrastructure/prisma-post-reader';
import { ModerationAnalyticsHandler } from './infrastructure/handlers/moderation-analytics.handler';
import {
  BlockUserUseCase,
  ListBlockedUsersUseCase,
  ReportPostUseCase,
  UnblockUserUseCase,
} from './application/moderation.use-cases';
import { ModerationController } from './presentation/moderation.controller';

@Module({
  imports: [
    SupabaseModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
  ],
  controllers: [ModerationController],
  providers: [
    { provide: POST_REPORT_REPOSITORY, useClass: PrismaPostReportRepository },
    { provide: USER_BLOCK_REPOSITORY, useClass: PrismaUserBlockRepository },
    { provide: USER_BLOCK_READER, useClass: PrismaUserBlockReader },
    { provide: MODERATION_USER_READER, useClass: PrismaModerationUserReader },
    { provide: MODERATION_POST_READER, useClass: PrismaModerationPostReader },
    ReportPostUseCase,
    BlockUserUseCase,
    UnblockUserUseCase,
    ListBlockedUsersUseCase,
    ModerationAnalyticsHandler,
  ],
  exports: [USER_BLOCK_READER],
})
export class ModerationModule implements OnModuleInit {
  constructor(
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
    private readonly analytics: ModerationAnalyticsHandler,
  ) {}

  onModuleInit(): void {
    for (const eventType of Object.values(MODERATION_EVENTS)) {
      this.bus.subscribe(eventType, this.analytics);
    }
  }
}
