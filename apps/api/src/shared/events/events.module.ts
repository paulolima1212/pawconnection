import { Global, Module } from '@nestjs/common';
import { DEAD_LETTER_QUEUE, EVENT_BUS, IDeadLetterQueue } from './event-bus';
import { InMemoryDeadLetterQueue } from './dead-letter-queue';
import { InMemoryEventBus } from './in-memory-event-bus';

/**
 * Global events module. Provides a single application-wide event bus and DLQ.
 * Any module can inject `EVENT_BUS` to publish and subscribe handlers, without
 * importing this module explicitly.
 */
@Global()
@Module({
  providers: [
    { provide: DEAD_LETTER_QUEUE, useClass: InMemoryDeadLetterQueue },
    {
      provide: EVENT_BUS,
      useFactory: (dlq: IDeadLetterQueue) => new InMemoryEventBus(dlq),
      inject: [DEAD_LETTER_QUEUE],
    },
  ],
  exports: [EVENT_BUS, DEAD_LETTER_QUEUE],
})
export class EventsModule {}
