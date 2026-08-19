import { randomUUID } from 'crypto';

/**
 * Contextual metadata carried by every domain event. Kept open-ended so new
 * cross-cutting concerns (tracing spans, feature flags, tenant ids, ...) can be
 * attached without changing the event contract.
 */
export interface EventMetadata {
  /** Correlates every event/log produced while handling a single request. */
  correlationId?: string;
  /** Id of the event that caused this one (for causal chains / event sourcing). */
  causationId?: string;
  /** User that triggered the action, when applicable. */
  userId?: string;
  /** Logical origin of the event (module / service name). */
  source?: string;
  [key: string]: unknown;
}

/**
 * Canonical shape of a domain event. The same envelope is used for the in-memory
 * bus today and can be serialized as-is onto Kafka/RabbitMQ later.
 */
export interface DomainEvent<TPayload = unknown> {
  readonly eventId: string;
  readonly aggregateId: string;
  readonly eventType: string;
  readonly occurredAt: Date;
  readonly payload: TPayload;
  readonly metadata: EventMetadata;
}

/**
 * Base class that fills in the boilerplate (eventId, occurredAt). Concrete events
 * only declare their `eventType` and payload shape.
 */
export abstract class BaseDomainEvent<TPayload> implements DomainEvent<TPayload> {
  readonly eventId: string = randomUUID();
  readonly occurredAt: Date = new Date();
  abstract readonly eventType: string;

  constructor(
    readonly aggregateId: string,
    readonly payload: TPayload,
    readonly metadata: EventMetadata = {},
  ) {}
}

/** Serializable view of an event, handy for logging and future transports. */
export function serializeEvent(event: DomainEvent): Record<string, unknown> {
  return {
    eventId: event.eventId,
    eventType: event.eventType,
    aggregateId: event.aggregateId,
    occurredAt: event.occurredAt.toISOString(),
    metadata: event.metadata,
    payload: event.payload,
  };
}
