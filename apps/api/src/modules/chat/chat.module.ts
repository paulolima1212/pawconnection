import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '../auth/auth.module';
import { ModerationModule } from '../moderation/moderation.module';
import { EVENT_BUS, IEventBus } from '../../shared/events/event-bus';
import { CHAT_REPOSITORY } from './domain/repositories/chat.repository';
import { CHAT_USER_READER } from './domain/ports/user-reader.port';
import { CHAT_POLICY } from './domain/ports/chat-policy.port';
import { CHAT_BLOCK_READER } from './domain/ports/block-reader.port';
import { CHAT_CONNECTION_READER } from './domain/ports/connection-reader.port';
import { USER_BLOCK_READER } from '../moderation/domain/ports/user-block-reader.port';
import { PrismaChatRepository } from './infrastructure/prisma-chat.repository';
import { PrismaChatUserReader } from './infrastructure/prisma-user-reader';
import { PrismaChatConnectionReader } from './infrastructure/prisma-connection-reader';
import { DefaultChatPolicy } from './infrastructure/default-chat-policy';
import { ChatRealtimeBroadcastHandler } from './infrastructure/handlers/chat-realtime-broadcast.handler';
import { ChatAnalyticsHandler } from './infrastructure/handlers/chat-analytics.handler';
import {
  CreateOrGetConversationUseCase,
  DeleteMessageUseCase,
  EditMessageUseCase,
  GetConversationUseCase,
  ListConversationsUseCase,
  ListMessagesUseCase,
  MarkConversationReadUseCase,
  SendMessageUseCase,
  ToggleMessageReactionUseCase,
} from './application/chat.use-cases';
import { ChatController } from './presentation/chat.controller';
import { ChatRealtimeService } from './realtime/chat-realtime.service';
import { RoomManager } from './realtime/room-manager';
import { PresenceManager } from './realtime/presence-manager';
import {
  InMemoryRealtimeMessageBroker,
  REALTIME_MESSAGE_BROKER,
} from './realtime/message-broker';
import { CHAT_EVENTS } from './domain/events/chat-events';

@Module({
  imports: [
    AuthModule,
    ModerationModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 200 }]),
  ],
  controllers: [ChatController],
  providers: [
    { provide: CHAT_REPOSITORY, useClass: PrismaChatRepository },
    { provide: CHAT_USER_READER, useClass: PrismaChatUserReader },
    { provide: CHAT_BLOCK_READER, useExisting: USER_BLOCK_READER },
    { provide: CHAT_CONNECTION_READER, useClass: PrismaChatConnectionReader },
    { provide: CHAT_POLICY, useClass: DefaultChatPolicy },
    { provide: REALTIME_MESSAGE_BROKER, useClass: InMemoryRealtimeMessageBroker },
    CreateOrGetConversationUseCase,
    GetConversationUseCase,
    ListConversationsUseCase,
    ListMessagesUseCase,
    SendMessageUseCase,
    ToggleMessageReactionUseCase,
    EditMessageUseCase,
    DeleteMessageUseCase,
    MarkConversationReadUseCase,
    ChatRealtimeService,
    RoomManager,
    PresenceManager,
    ChatRealtimeBroadcastHandler,
    ChatAnalyticsHandler,
  ],
  exports: [ChatRealtimeService],
})
export class ChatModule implements OnModuleInit {
  constructor(
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
    private readonly realtimeBroadcast: ChatRealtimeBroadcastHandler,
    private readonly analytics: ChatAnalyticsHandler,
  ) {}

  onModuleInit(): void {
    for (const eventType of Object.values(CHAT_EVENTS)) {
      this.bus.subscribe(eventType, this.realtimeBroadcast);
      this.bus.subscribe(eventType, this.analytics);
    }
  }
}
