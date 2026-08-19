/**
 * Abstraction for cross-instance realtime fan-out.
 * In-memory implementation works for a single API node; swap for Redis Pub/Sub
 * or Supabase Realtime bridge when scaling horizontally.
 */
export const REALTIME_MESSAGE_BROKER = Symbol('REALTIME_MESSAGE_BROKER');

export type BrokerHandler = (channel: string, payload: unknown) => void;

export interface IRealtimeMessageBroker {
  publish(channel: string, payload: unknown): Promise<void>;
  subscribe(channel: string, handler: BrokerHandler): () => void;
}

export class InMemoryRealtimeMessageBroker implements IRealtimeMessageBroker {
  private readonly channels = new Map<string, Set<BrokerHandler>>();

  async publish(channel: string, payload: unknown): Promise<void> {
    const handlers = this.channels.get(channel);
    if (!handlers) return;
    for (const handler of handlers) {
      handler(channel, payload);
    }
  }

  subscribe(channel: string, handler: BrokerHandler): () => void {
    let set = this.channels.get(channel);
    if (!set) {
      set = new Set();
      this.channels.set(channel, set);
    }
    set.add(handler);
    return () => set!.delete(handler);
  }
}

/** Placeholder for Supabase Realtime / Redis — wire channel broadcast in a future deploy. */
export class SupabaseRealtimeMessageBrokerStub implements IRealtimeMessageBroker {
  async publish(_channel: string, _payload: unknown): Promise<void> {
    /* no-op until Supabase Realtime channel bridge is configured */
  }

  subscribe(_channel: string, _handler: BrokerHandler): () => void {
    return () => undefined;
  }
}
