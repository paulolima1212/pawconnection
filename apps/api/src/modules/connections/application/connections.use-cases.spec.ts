/* eslint-disable @typescript-eslint/require-await */
import {
  AcceptConnectionRequestUseCase,
  CancelConnectionRequestUseCase,
  CreateConnectionRequestUseCase,
  RejectConnectionRequestUseCase,
  RemoveFriendUseCase,
} from './connections.use-cases';
import { IConnectionRequestRepository } from '../domain/repositories/connection-request.repository';
import { IUserRepository } from '../../profile/domain/repositories/user.repository';
import { IUserBlockReader } from '../../moderation/domain/ports/user-block-reader.port';
import { IEventBus } from '../../../shared/events/event-bus';
import { ConnectionRequestEntity } from '../../../shared/domain/types';
import { FRIENDSHIP_EVENTS } from '../domain/events/friendship-events';

const paulo = 'paulo';
const maria = 'maria';

function request(
  overrides: Partial<ConnectionRequestEntity> = {},
): ConnectionRequestEntity {
  return {
    id: 'req-1',
    senderId: paulo,
    recipientId: maria,
    type: 'friendship',
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function harness(rows: ConnectionRequestEntity[] = []) {
  const published: string[] = [];
  const store = [...rows];
  const requests = {
    listForUser: async () => store,
    findById: async (id: string) => store.find((row) => row.id === id) ?? null,
    findBetween: async (userId: string, otherUserId: string) =>
      store.filter(
        (row) =>
          (row.senderId === userId && row.recipientId === otherUserId) ||
          (row.senderId === otherUserId && row.recipientId === userId),
      ),
    accept: async (id: string) => request({ id, status: 'accepted' }),
    reject: async (id: string) => request({ id, status: 'rejected' }),
    markPending: async (id: string) => request({ id, status: 'pending' }),
    reopenAs: async (id: string, senderId: string, recipientId: string) =>
      request({ id, senderId, recipientId, status: 'pending' }),
    create: async (senderId: string, recipientId: string) => {
      const created = request({ id: 'created', senderId, recipientId });
      store.push(created);
      return created;
    },
    transition: async (id: string, _from: string, to: string) => {
      const current = store.find((row) => row.id === id);
      if (!current) return null;
      current.status = to as ConnectionRequestEntity['status'];
      return current;
    },
    listAcceptedFriendIds: async () => [],
    listAcceptedEdges: async () => [],
    listFriendsPage: async () => ({ rows: [], hasMore: false }),
    listProfiles: async () => [],
    listRequestPolicies: async () => [],
    getPrivacy: async () => ({
      friendRequestPolicy: 'everyone' as const,
      friendsListVisibility: 'everyone' as const,
      defaultPostVisibility: 'public' as const,
    }),
    updatePrivacy: async (_id: string, patch: object) => ({
      friendRequestPolicy: 'everyone' as const,
      friendsListVisibility: 'everyone' as const,
      defaultPostVisibility: 'public' as const,
      ...patch,
    }),
    deactivateBetween: async () => 0,
  } as IConnectionRequestRepository;
  const users = {
    findById: async (id: string) =>
      id === maria || id === paulo ? { id } : null,
  } as IUserRepository;
  const blocks = {
    isBlockedBetween: async () => false,
    isBlockedBy: async () => false,
    listHiddenUserIds: async () => [],
    listBlockedByMe: async () => [],
    listWhoBlocked: async () => [],
  } as IUserBlockReader;
  const bus = {
    subscribe: () => undefined,
    publish: async (event: { eventType: string }) => {
      published.push(event.eventType);
    },
    publishAll: async () => undefined,
  } as IEventBus;
  return {
    published,
    requests,
    users,
    blocks,
    bus,
    useCase: new CreateConnectionRequestUseCase(requests, users, blocks, bus),
  };
}

describe('CreateConnectionRequestUseCase', () => {
  it('rejects a request to yourself', async () => {
    const { useCase } = harness();
    await expect(
      useCase.execute(paulo, paulo, 'Friendship' as never),
    ).rejects.toThrow(/yourself/);
  });

  it('does not create a second request when Maria already asked Paulo', async () => {
    const existing = request({ senderId: maria, recipientId: paulo });
    const { useCase, published } = harness([existing]);
    const result = await useCase.execute(paulo, maria, 'Friendship' as never);
    expect(result.id).toBe(existing.id);
    expect(published).toEqual([]);
  });

  it('publishes a friend request when Paulo asks Maria', async () => {
    const { useCase, published } = harness();
    const result = await useCase.execute(paulo, maria, 'Friendship' as never);
    expect(result.senderId).toBe(paulo);
    expect(published).toEqual([FRIENDSHIP_EVENTS.REQUEST_SENT]);
  });

  it('does not create a second pending request from Paulo to Maria', async () => {
    const existing = request();
    const { useCase, published } = harness([existing]);
    const result = await useCase.execute(paulo, maria, 'Friendship' as never);
    expect(result.id).toBe(existing.id);
    expect(published).toEqual([]);
  });

  it('rejects a request to someone who is already a friend', async () => {
    const { useCase } = harness([request({ status: 'accepted' })]);
    await expect(
      useCase.execute(paulo, maria, 'Friendship' as never),
    ).rejects.toThrow(/Already connected/);
  });

  it('rejects a request when the users have blocked each other', async () => {
    const { useCase, requests, users, bus } = harness();
    const blocked = {
      ...({
        isBlockedBetween: async () => true,
        isBlockedBy: async () => false,
        listHiddenUserIds: async () => [],
        listBlockedByMe: async () => [],
        listWhoBlocked: async () => [],
      } as IUserBlockReader),
    };
    const useCaseBlocked = new CreateConnectionRequestUseCase(
      requests,
      users,
      blocked,
      bus,
    );
    await expect(
      useCaseBlocked.execute(paulo, maria, 'Friendship' as never),
    ).rejects.toThrow(/cannot interact/);
  });
});

describe('friend request lifecycle', () => {
  it('lets only Maria accept Paulo request', async () => {
    const pending = request();
    const { requests, blocks, bus, published } = harness([pending]);
    const accept = new AcceptConnectionRequestUseCase(requests, blocks, bus);
    await expect(accept.execute(pending.id, paulo)).rejects.toThrow(
      /recipient/,
    );
    const accepted = await accept.execute(pending.id, maria);
    expect(accepted.status).toBe('accepted');
    expect(published).toEqual([FRIENDSHIP_EVENTS.REQUEST_ACCEPTED]);
  });

  it('lets only Maria decline and only Paulo cancel', async () => {
    const pending = request();
    const { requests, blocks, bus, published } = harness([pending]);
    const reject = new RejectConnectionRequestUseCase(requests, blocks, bus);
    await expect(reject.execute(pending.id, 'carlos')).rejects.toThrow(
      /cannot update/,
    );
    const declined = await reject.execute(pending.id, maria);
    expect(declined.status).toBe('rejected');
    expect(published).toEqual([FRIENDSHIP_EVENTS.REQUEST_DECLINED]);

    const outgoing = request({ id: 'req-2' });
    const second = harness([outgoing]);
    const cancel = new CancelConnectionRequestUseCase(
      second.requests,
      second.bus,
    );
    await expect(cancel.execute(outgoing.id, maria)).rejects.toThrow(
      /sender/,
    );
    const cancelled = await cancel.execute(outgoing.id, paulo);
    expect(cancelled.status).toBe('cancelled');
    expect(second.published).toEqual([FRIENDSHIP_EVENTS.REQUEST_CANCELLED]);
  });

  it('removes an accepted friendship without touching other domains', async () => {
    const friends = request({ status: 'accepted' });
    const { requests, bus, published } = harness([friends]);
    const remove = new RemoveFriendUseCase(requests, bus);
    await expect(remove.execute(paulo, 'carlos')).resolves.toEqual({
      removed: false,
    });
    await expect(remove.execute(paulo, maria)).resolves.toEqual({
      removed: true,
    });
    expect(friends.status).toBe('removed');
    expect(published).toEqual([FRIENDSHIP_EVENTS.REMOVED]);
  });
});
