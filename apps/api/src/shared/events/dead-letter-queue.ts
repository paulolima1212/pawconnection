import { Injectable, Logger } from '@nestjs/common';
import { DeadLetter, IDeadLetterQueue } from './event-bus';
import { serializeEvent } from './domain-event';

/**
 * In-memory Dead Letter Queue. Keeps the last N permanently-failed handler
 * invocations so they can be inspected / replayed. A broker-backed DLQ can later
 * implement the same interface without touching the event bus.
 */
@Injectable()
export class InMemoryDeadLetterQueue implements IDeadLetterQueue {
  private readonly logger = new Logger('DeadLetterQueue');
  private readonly entries: DeadLetter[] = [];
  private readonly maxEntries = 500;

  async add(entry: DeadLetter): Promise<void> {
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
    this.logger.error({
      msg: 'event.dead_lettered',
      handler: entry.handlerName,
      attempts: entry.attempts,
      error: entry.error,
      event: serializeEvent(entry.event),
    });
  }

  async list(): Promise<DeadLetter[]> {
    return [...this.entries];
  }

  size(): number {
    return this.entries.length;
  }
}
