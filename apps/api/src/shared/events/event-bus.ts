import { DomainEvent } from './domain-event';

export const EVENT_BUS = Symbol('EVENT_BUS');
export const DEAD_LETTER_QUEUE = Symbol('DEAD_LETTER_QUEUE');

/**
 * A subscriber for one event type. Handlers must be side-effect isolated:
 * a failure in one handler must never break the publisher or sibling handlers.
 */
export interface IEventHandler<E extends DomainEvent = DomainEvent> {
  /** Stable name used for logging, retry accounting and DLQ records. */
  readonly handlerName: string;
  handle(event: E): Promise<void> | void;
}

/**
 * Publisher + dispatcher contract. Implementations decide transport (in-memory
 * now, message broker later) but the application layer only depends on this.
 */
export interface IEventBus {
  /** Register a handler for a given event type. */
  subscribe(eventType: string, handler: IEventHandler): void;
  /** Publish a single event to all subscribers. */
  publish(event: DomainEvent): Promise<void>;
  /** Publish a batch of events preserving order. */
  publishAll(events: DomainEvent[]): Promise<void>;
}

/** A handler invocation that exhausted its retries. */
export interface DeadLetter {
  readonly event: DomainEvent;
  readonly handlerName: string;
  readonly error: string;
  readonly attempts: number;
  readonly failedAt: Date;
}

/**
 * Holding area for permanently failed handler invocations. In-memory today,
 * but the interface mirrors a broker DLQ so it can be swapped transparently.
 */
export interface IDeadLetterQueue {
  add(entry: DeadLetter): Promise<void>;
  list(): Promise<DeadLetter[]>;
  size(): number;
}
