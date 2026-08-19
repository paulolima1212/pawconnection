import { BaseDomainEvent } from './domain-event';
import { InMemoryDeadLetterQueue } from './dead-letter-queue';
import { InMemoryEventBus } from './in-memory-event-bus';
import { IEventHandler } from './event-bus';

class TestEvent extends BaseDomainEvent<{ value: number }> {
  readonly eventType = 'test.event';
}

function makeBus(maxAttempts = 3) {
  const dlq = new InMemoryDeadLetterQueue();
  const bus = new InMemoryEventBus(dlq, { maxAttempts, retryBaseDelayMs: 1 });
  return { dlq, bus };
}

describe('InMemoryEventBus', () => {
  it('delivers a published event to a subscribed handler', async () => {
    const { bus } = makeBus();
    const received: number[] = [];
    const handler: IEventHandler<TestEvent> = {
      handlerName: 'collector',
      handle: (e) => {
        received.push(e.payload.value);
      },
    };
    bus.subscribe('test.event', handler);

    await bus.publish(new TestEvent('agg-1', { value: 42 }));

    expect(received).toEqual([42]);
  });

  it('fans out to every handler in parallel and isolates failures', async () => {
    const { bus, dlq } = makeBus(1);
    const ok: string[] = [];
    bus.subscribe('test.event', {
      handlerName: 'failing',
      handle: () => {
        throw new Error('boom');
      },
    });
    bus.subscribe('test.event', {
      handlerName: 'healthy',
      handle: () => {
        ok.push('handled');
      },
    });

    await bus.publish(new TestEvent('agg-1', { value: 1 }));

    expect(ok).toEqual(['handled']); // healthy handler still ran
    expect(dlq.size()).toBe(1); // failing handler dead-lettered
  });

  it('retries a flaky handler and succeeds before exhausting attempts', async () => {
    const { bus, dlq } = makeBus(3);
    let attempts = 0;
    bus.subscribe('test.event', {
      handlerName: 'flaky',
      handle: () => {
        attempts += 1;
        if (attempts < 3) throw new Error('transient');
      },
    });

    await bus.publish(new TestEvent('agg-1', { value: 1 }));

    expect(attempts).toBe(3);
    expect(dlq.size()).toBe(0);
  });

  it('routes permanently failing handlers to the dead letter queue', async () => {
    const { bus, dlq } = makeBus(2);
    bus.subscribe('test.event', {
      handlerName: 'always-fails',
      handle: () => {
        throw new Error('nope');
      },
    });

    await bus.publish(new TestEvent('agg-7', { value: 9 }));

    const letters = await dlq.list();
    expect(letters).toHaveLength(1);
    expect(letters[0].handlerName).toBe('always-fails');
    expect(letters[0].attempts).toBe(2);
    expect(letters[0].event.aggregateId).toBe('agg-7');
  });

  it('subscribes idempotently by handler name', async () => {
    const { bus } = makeBus();
    let count = 0;
    const handler: IEventHandler<TestEvent> = {
      handlerName: 'dup',
      handle: () => {
        count += 1;
      },
    };
    bus.subscribe('test.event', handler);
    bus.subscribe('test.event', handler);

    await bus.publish(new TestEvent('agg-1', { value: 1 }));

    expect(count).toBe(1);
  });

  it('publishAll preserves order', async () => {
    const { bus } = makeBus();
    const seen: number[] = [];
    bus.subscribe('test.event', {
      handlerName: 'order',
      handle: (e: TestEvent) => {
        seen.push(e.payload.value);
      },
    });

    await bus.publishAll([
      new TestEvent('a', { value: 1 }),
      new TestEvent('a', { value: 2 }),
      new TestEvent('a', { value: 3 }),
    ]);

    expect(seen).toEqual([1, 2, 3]);
  });
});
