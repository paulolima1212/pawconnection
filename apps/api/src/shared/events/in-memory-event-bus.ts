import { Inject, Injectable, Logger } from '@nestjs/common';
import { DomainEvent, serializeEvent } from './domain-event';
import {
  DEAD_LETTER_QUEUE,
  IDeadLetterQueue,
  IEventBus,
  IEventHandler,
} from './event-bus';

export interface EventBusOptions {
  /** Total attempts per handler before dead-lettering (>= 1). */
  maxAttempts: number;
  /** Base delay (ms) for exponential backoff between retries. */
  retryBaseDelayMs: number;
}

const DEFAULT_OPTIONS: EventBusOptions = {
  maxAttempts: 3,
  retryBaseDelayMs: 50,
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Synchronous-publish, async-dispatch in-memory event bus.
 *
 * Design goals:
 * - Decoupled: publishers never know who subscribes.
 * - Resilient: a handler failure is retried with exponential backoff and, if it
 *   keeps failing, routed to a Dead Letter Queue instead of bubbling up.
 * - Isolated: handlers for the same event run in parallel; one failure does not
 *   abort the others (Promise.allSettled).
 * - Observable: every publish/handle/retry/dead-letter is logged with the
 *   correlationId carried in event metadata.
 *
 * It implements the same `IEventBus` contract a Kafka/RabbitMQ adapter would, so
 * swapping the transport later is a module-wiring change, not an app change.
 */
@Injectable()
export class InMemoryEventBus implements IEventBus {
  private readonly logger = new Logger('EventBus');
  private readonly handlers = new Map<string, IEventHandler[]>();
  private readonly options: EventBusOptions;

  constructor(
    @Inject(DEAD_LETTER_QUEUE) private readonly deadLetters: IDeadLetterQueue,
    options?: Partial<EventBusOptions>,
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  subscribe(eventType: string, handler: IEventHandler): void {
    const existing = this.handlers.get(eventType) ?? [];
    if (existing.some((h) => h.handlerName === handler.handlerName)) {
      return; // idempotent subscription
    }
    existing.push(handler);
    this.handlers.set(eventType, existing);
    this.logger.log({
      msg: 'event.subscribed',
      eventType,
      handler: handler.handlerName,
    });
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) ?? [];
    this.logger.log({
      msg: 'event.published',
      handlers: handlers.length,
      ...serializeEvent(event),
    });

    if (handlers.length === 0) return;

    await Promise.allSettled(
      handlers.map((handler) => this.dispatchWithRetry(event, handler)),
    );
  }

  private async dispatchWithRetry(
    event: DomainEvent,
    handler: IEventHandler,
  ): Promise<void> {
    const { maxAttempts, retryBaseDelayMs } = this.options;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await handler.handle(event);
        this.logger.debug({
          msg: 'event.handled',
          handler: handler.handlerName,
          eventType: event.eventType,
          eventId: event.eventId,
          attempt,
          correlationId: event.metadata.correlationId,
        });
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn({
          msg: 'event.handler_failed',
          handler: handler.handlerName,
          eventType: event.eventType,
          eventId: event.eventId,
          attempt,
          maxAttempts,
          error: message,
          correlationId: event.metadata.correlationId,
        });

        if (attempt >= maxAttempts) {
          await this.deadLetters.add({
            event,
            handlerName: handler.handlerName,
            error: message,
            attempts: attempt,
            failedAt: new Date(),
          });
          return;
        }
        await sleep(retryBaseDelayMs * 2 ** (attempt - 1));
      }
    }
  }
}
