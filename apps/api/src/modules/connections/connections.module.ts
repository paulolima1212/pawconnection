import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { EVENT_BUS, IEventBus } from '../../shared/events/event-bus';
import { ProfileModule } from '../profile/profile.module';
import { ModerationModule } from '../moderation/moderation.module';
import { MODERATION_EVENTS } from '../moderation/domain/events/moderation-events';
import { CONNECTION_REQUEST_REPOSITORY } from './domain/repositories/connection-request.repository';
import { FRIENDSHIP_EVENTS } from './domain/events/friendship-events';
import { PrismaConnectionRequestRepository } from './infrastructure/prisma-connection-request.repository';
import { FriendshipBlockHandler } from './infrastructure/handlers/friendship-block.handler';
import {
  FriendshipAnalyticsHandler,
  FriendshipNotificationHandler,
} from './infrastructure/handlers/friendship-notification.handler';
import {
  AcceptConnectionRequestUseCase,
  CancelConnectionRequestUseCase,
  CreateConnectionRequestUseCase,
  GetConnectionWithUserUseCase,
  GetFriendshipPrivacyUseCase,
  ListFriendSuggestionsUseCase,
  ListFriendsUseCase,
  ListInboxRequestsUseCase,
  ListMutualFriendsUseCase,
  RejectConnectionRequestUseCase,
  RemoveFriendUseCase,
  UpdateFriendshipPrivacyUseCase,
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
    GetConnectionWithUserUseCase,
    CancelConnectionRequestUseCase,
    RemoveFriendUseCase,
    ListFriendsUseCase,
    ListMutualFriendsUseCase,
    ListFriendSuggestionsUseCase,
    GetFriendshipPrivacyUseCase,
    UpdateFriendshipPrivacyUseCase,
    FriendshipBlockHandler,
    FriendshipNotificationHandler,
    FriendshipAnalyticsHandler,
  ],
  exports: [CONNECTION_REQUEST_REPOSITORY],
})
export class ConnectionsModule implements OnModuleInit {
  constructor(
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
    private readonly blockHandler: FriendshipBlockHandler,
    private readonly notifications: FriendshipNotificationHandler,
    private readonly analytics: FriendshipAnalyticsHandler,
  ) {}

  onModuleInit(): void {
    this.bus.subscribe(MODERATION_EVENTS.USER_BLOCKED, this.blockHandler);
    for (const eventType of Object.values(FRIENDSHIP_EVENTS)) {
      this.bus.subscribe(eventType, this.notifications);
      this.bus.subscribe(eventType, this.analytics);
    }
  }
}
