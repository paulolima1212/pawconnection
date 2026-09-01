import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module';
import { ModerationModule } from '../moderation/moderation.module';
import { CONNECTION_REQUEST_REPOSITORY } from './domain/repositories/connection-request.repository';
import { PrismaConnectionRequestRepository } from './infrastructure/prisma-connection-request.repository';
import {
  AcceptConnectionRequestUseCase,
  CreateConnectionRequestUseCase,
  ListInboxRequestsUseCase,
  RejectConnectionRequestUseCase,
} from './application/connections.use-cases';
import { ConnectionsController } from './presentation/connections.controller';

@Module({
  imports: [ProfileModule, ModerationModule],
  controllers: [ConnectionsController],
  providers: [
    {
      provide: CONNECTION_REQUEST_REPOSITORY,
      useClass: PrismaConnectionRequestRepository,
    },
    ListInboxRequestsUseCase,
    AcceptConnectionRequestUseCase,
    RejectConnectionRequestUseCase,
    CreateConnectionRequestUseCase,
  ],
  exports: [CONNECTION_REQUEST_REPOSITORY],
})
export class ConnectionsModule {}
