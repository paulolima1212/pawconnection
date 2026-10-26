import { Inject, Injectable } from '@nestjs/common';
import {
  AppConnectionIntent,
  ConnectionTypeValue,
  RequestDirection,
} from '../../../shared/domain/types';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../shared/domain/result';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../profile/domain/repositories/user.repository';
import {
  directionSpec,
  PendingRequestsSpec,
  RequestsByTypeSpec,
} from '../domain/specifications/connection-request';
import { connectionTypeFromLookingFor } from '../domain/connection-intent.mapper';
import {
  authorizeAccept,
  authorizeCancel,
  authorizeDecline,
  authorizeUnfriend,
  connectionWithUser,
  planCreateConnection,
  ProfileConnectionView,
} from '../domain/connection-relationship';
import {
  canSendFriendRequest,
  canViewFriendsList,
  mutualFriendIds,
  otherParticipant,
  rankFriendSuggestions,
} from '../domain/friendship-graph';
import {
  FriendRequestAcceptedEvent,
  FriendRequestCancelledEvent,
  FriendRequestDeclinedEvent,
  FriendRequestSentEvent,
  FriendshipRemovedEvent,
} from '../domain/events/friendship-events';
import { EVENT_BUS, IEventBus } from '../../../shared/events/event-bus';
import { haversineKm } from '../../../shared/infrastructure/mappers/prisma.mapper';
import { Prisma } from '@prisma/client';
import {
  FriendRequestPolicyValue,
  FriendsListVisibilityValue,
  PostVisibilityValue,
  UserSummary,
} from '../../../shared/domain/types';
import {
  CONNECTION_REQUEST_REPOSITORY,
  IConnectionRequestRepository,
} from '../domain/repositories/connection-request.repository';
import {
  USER_BLOCK_READER,
  IUserBlockReader,
} from '../../moderation/domain/ports/user-block-reader.port';
import { PartiesNotBlockedSpec } from '../../moderation/domain/specifications/hidden-user';

@Injectable()
export class ListInboxRequestsUseCase {
  constructor(
    @Inject(CONNECTION_REQUEST_REPOSITORY)
    private readonly requests: IConnectionRequestRepository,
    @Inject(USER_BLOCK_READER) private readonly blocks: IUserBlockReader,
  ) {}

  async execute(
    userId: string,
    filters: { type?: ConnectionTypeValue; direction?: RequestDirection },
  ) {
    let items = await this.requests.listForUser(userId);
    const hidden = new Set(await this.blocks.listHiddenUserIds(userId));
    const notBlocked = new PartiesNotBlockedSpec(hidden);
    items = items.filter((r) => notBlocked.isSatisfiedBy(r));
    items = items.filter((r) => new PendingRequestsSpec().isSatisfiedBy(r));

    if (filters.type) {
      const typeSpec = new RequestsByTypeSpec(filters.type);
      items = items.filter((r) => typeSpec.isSatisfiedBy(r));
    }

    if (filters.direction) {
      const dirSpec = directionSpec(userId, filters.direction);
      items = items.filter((r) => dirSpec.isSatisfiedBy(r));
    }

    return items;
  }
}

@Injectable()
export class AcceptConnectionRequestUseCase {
  constructor(
    @Inject(CONNECTION_REQUEST_REPOSITORY)
    private readonly requests: IConnectionRequestRepository,
    @Inject(USER_BLOCK_READER) private readonly blocks: IUserBlockReader,
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
  ) {}

  async execute(id: string, userId: string) {
    const request = await this.requests.findById(id);
    const decision = authorizeAccept(request, userId);
    if (decision === 'not-found') throw new NotFoundError('Request not found');
    if (decision === 'forbidden')
      throw new ForbiddenError('Only the recipient can accept');
    if (decision === 'not-pending')
      throw new ConflictError('Request is not pending');
    if (await this.blocks.isBlockedBetween(userId, request!.senderId)) {
      throw new ForbiddenError('You cannot interact with this user');
    }
    const updated = await this.requests.transition(id, 'pending', 'accepted');
    if (!updated) throw new ConflictError('Request is not pending');
    await this.bus.publish(
      new FriendRequestAcceptedEvent({
        requestId: updated.id,
        actorId: userId,
        otherUserId: updated.senderId,
      }),
    );
    return updated;
  }
}

@Injectable()
export class RejectConnectionRequestUseCase {
  constructor(
    @Inject(CONNECTION_REQUEST_REPOSITORY)
    private readonly requests: IConnectionRequestRepository,
    @Inject(USER_BLOCK_READER) private readonly blocks: IUserBlockReader,
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
  ) {}

  async execute(id: string, userId: string) {
    const request = await this.requests.findById(id);
    if (!request) throw new NotFoundError('Request not found');
    const otherId = otherParticipant(request, userId);
    if (await this.blocks.isBlockedBetween(userId, otherId)) {
      throw new ForbiddenError('You cannot interact with this user');
    }
    if (authorizeDecline(request, userId) === 'ok') {
      const updated = await this.requests.transition(id, 'pending', 'rejected');
      if (!updated) throw new ConflictError('Request is not pending');
      await this.bus.publish(
        new FriendRequestDeclinedEvent({
          requestId: updated.id,
          actorId: userId,
          otherUserId: updated.senderId,
        }),
      );
      return updated;
    }
    if (authorizeCancel(request, userId) === 'ok') {
      const updated = await this.requests.transition(
        id,
        'pending',
        'cancelled',
      );
      if (!updated) throw new ConflictError('Request is not pending');
      await this.bus.publish(
        new FriendRequestCancelledEvent({
          requestId: updated.id,
          actorId: userId,
          otherUserId: updated.recipientId,
        }),
      );
      return updated;
    }
    throw new ForbiddenError('You cannot update this request');
  }
}

@Injectable()
export class CreateConnectionRequestUseCase {
  constructor(
    @Inject(CONNECTION_REQUEST_REPOSITORY)
    private readonly requests: IConnectionRequestRepository,
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(USER_BLOCK_READER) private readonly blocks: IUserBlockReader,
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
  ) {}

  async execute(
    senderId: string,
    recipientId: string,
    lookingFor: AppConnectionIntent,
  ) {
    if (senderId === recipientId) {
      throw new ValidationError('Cannot connect with yourself');
    }

    if (await this.blocks.isBlockedBetween(senderId, recipientId)) {
      throw new ForbiddenError('You cannot interact with this user');
    }

    const recipient = await this.users.findById(recipientId);
    if (!recipient) {
      throw new NotFoundError('User not found');
    }

    const type: ConnectionTypeValue = connectionTypeFromLookingFor(lookingFor);
    const existing = await this.requests.findBetween(senderId, recipientId);
    const plan = planCreateConnection(senderId, type, existing);
    if (plan.kind === 'conflict') {
      throw new ConflictError(plan.message);
    }
    if (plan.kind === 'return' || plan.kind === 'surface-incoming') {
      const current = existing.find((row) => row.id === plan.id);
      if (current) return current;
    }
    if (plan.kind === 'create') {
      await this.assertRequestAllowed(senderId, recipientId);
    }
    if (plan.kind === 'reopen') {
      await this.assertRequestAllowed(senderId, recipientId);
      const reopened = await this.requests.markPending(plan.id);
      await this.publishSent(reopened.id, senderId, recipientId);
      return reopened;
    }

    try {
      const created = await this.requests.create(senderId, recipientId, type);
      await this.publishSent(created.id, senderId, recipientId);
      return created;
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
      const again = await this.requests.findBetween(senderId, recipientId);
      const retry = planCreateConnection(senderId, type, again);
      if (retry.kind === 'return' || retry.kind === 'surface-incoming') {
        const current = again.find((row) => row.id === retry.id);
        if (current) return current;
      }
      const closed = again.find((row) => row.type === type);
      if (
        closed &&
        closed.status !== 'accepted' &&
        closed.status !== 'pending'
      ) {
        const reopened = await this.requests.reopenAs(
          closed.id,
          senderId,
          recipientId,
        );
        await this.publishSent(reopened.id, senderId, recipientId);
        return reopened;
      }
      throw new ConflictError('Connection request already exists');
    }
  }

  private async assertRequestAllowed(senderId: string, recipientId: string) {
    const privacy = await this.requests.getPrivacy(recipientId);
    const policy = privacy?.friendRequestPolicy ?? 'everyone';
    let mutualFriendCount = 0;
    if (policy === 'friends_of_friends') {
      const [mine, theirs] = await Promise.all([
        this.requests.listAcceptedFriendIds(senderId),
        this.requests.listAcceptedFriendIds(recipientId),
      ]);
      mutualFriendCount = mutualFriendIds(mine, theirs).length;
    }
    if (!canSendFriendRequest({ policy, mutualFriendCount })) {
      throw new ForbiddenError('This person is not accepting friend requests');
    }
  }

  private publishSent(
    requestId: string,
    senderId: string,
    recipientId: string,
  ) {
    return this.bus.publish(
      new FriendRequestSentEvent({
        requestId,
        actorId: senderId,
        otherUserId: recipientId,
      }),
    );
  }
}

@Injectable()
export class GetConnectionWithUserUseCase {
  constructor(
    @Inject(CONNECTION_REQUEST_REPOSITORY)
    private readonly requests: IConnectionRequestRepository,
    @Inject(USER_BLOCK_READER) private readonly blocks: IUserBlockReader,
  ) {}

  async execute(
    viewerId: string,
    otherUserId: string,
  ): Promise<ProfileConnectionView> {
    if (viewerId === otherUserId) {
      return { status: 'none', requestId: null };
    }
    if (await this.blocks.isBlockedBetween(viewerId, otherUserId)) {
      return { status: 'blocked', requestId: null };
    }
    const rows = await this.requests.findBetween(viewerId, otherUserId);
    return connectionWithUser(viewerId, rows);
  }
}

function isUniqueConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

export type FriendCard = {
  id: string;
  user: UserSummary;
  mutualFriendCount: number;
};

export type FriendPage = {
  items: FriendCard[];
  nextCursor: string | null;
  hasMore: boolean;
};

@Injectable()
export class CancelConnectionRequestUseCase {
  constructor(
    @Inject(CONNECTION_REQUEST_REPOSITORY)
    private readonly requests: IConnectionRequestRepository,
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
  ) {}

  async execute(id: string, userId: string) {
    const request = await this.requests.findById(id);
    const decision = authorizeCancel(request, userId);
    if (decision === 'not-found') throw new NotFoundError('Request not found');
    if (decision === 'forbidden')
      throw new ForbiddenError('Only the sender can cancel');
    if (decision === 'not-pending')
      throw new ConflictError('Request is not pending');
    const updated = await this.requests.transition(id, 'pending', 'cancelled');
    if (!updated) throw new ConflictError('Request is not pending');
    await this.bus.publish(
      new FriendRequestCancelledEvent({
        requestId: updated.id,
        actorId: userId,
        otherUserId: updated.recipientId,
      }),
    );
    return updated;
  }
}

@Injectable()
export class RemoveFriendUseCase {
  constructor(
    @Inject(CONNECTION_REQUEST_REPOSITORY)
    private readonly requests: IConnectionRequestRepository,
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
  ) {}

  async execute(userId: string, otherUserId: string) {
    const rows = await this.requests.findBetween(userId, otherUserId);
    const accepted = rows.find((row) => row.status === 'accepted') ?? null;
    const decision = authorizeUnfriend(accepted, userId);
    if (decision === 'not-friends') return { removed: false };
    if (decision === 'forbidden')
      throw new ForbiddenError('You are not part of this friendship');
    const updated = await this.requests.transition(
      accepted!.id,
      'accepted',
      'removed',
    );
    if (!updated) return { removed: false };
    await this.bus.publish(
      new FriendshipRemovedEvent({
        requestId: updated.id,
        actorId: userId,
        otherUserId,
      }),
    );
    return { removed: true };
  }
}

@Injectable()
export class ListFriendsUseCase {
  constructor(
    @Inject(CONNECTION_REQUEST_REPOSITORY)
    private readonly requests: IConnectionRequestRepository,
    @Inject(USER_BLOCK_READER) private readonly blocks: IUserBlockReader,
  ) {}

  async execute(
    viewerId: string,
    ownerId: string,
    query: { cursor?: string | null; limit?: number; q?: string },
  ): Promise<FriendPage> {
    if (await this.blocks.isBlockedBetween(viewerId, ownerId)) {
      throw new ForbiddenError('You cannot view this friends list');
    }
    const privacy = await this.requests.getPrivacy(ownerId);
    const viewerFriends = await this.requests.listAcceptedFriendIds(viewerId);
    const viewerIsFriend =
      viewerId === ownerId || viewerFriends.includes(ownerId);
    if (
      !canViewFriendsList({
        visibility: privacy?.friendsListVisibility ?? 'everyone',
        viewerId,
        ownerId,
        viewerIsFriend,
      })
    ) {
      throw new ForbiddenError('This friends list is private');
    }
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);
    const page = await this.requests.listFriendsPage({
      ownerId,
      cursor: query.cursor ?? null,
      limit,
      q: query.q,
    });
    const cards = await this.withMutualCounts(viewerId, ownerId, page.rows);
    const last = page.rows[page.rows.length - 1];
    return {
      items: cards,
      nextCursor: page.hasMore && last ? last.id : null,
      hasMore: page.hasMore,
    };
  }

  private async withMutualCounts(
    viewerId: string,
    ownerId: string,
    rows: Awaited<
      ReturnType<IConnectionRequestRepository['listFriendsPage']>
    >['rows'],
  ): Promise<FriendCard[]> {
    const mine = new Set(await this.requests.listAcceptedFriendIds(viewerId));
    const friendIds = rows.map((row) => otherParticipant(row, ownerId));
    const edges = await this.requests.listAcceptedEdges(friendIds);
    return rows.map((row) => {
      const friendId = otherParticipant(row, ownerId);
      const theirs = edges
        .filter(
          (edge) => edge.senderId === friendId || edge.recipientId === friendId,
        )
        .map((edge) =>
          edge.senderId === friendId ? edge.recipientId : edge.senderId,
        );
      const user = (
        row.senderId === friendId ? row.sender : row.recipient
      ) as UserSummary;
      return {
        id: row.id,
        user,
        mutualFriendCount: mutualFriendIds(
          [...mine].filter((id) => id !== friendId),
          theirs,
        ).length,
      };
    });
  }
}

@Injectable()
export class ListMutualFriendsUseCase {
  constructor(
    @Inject(CONNECTION_REQUEST_REPOSITORY)
    private readonly requests: IConnectionRequestRepository,
    @Inject(USER_BLOCK_READER) private readonly blocks: IUserBlockReader,
  ) {}

  async execute(
    viewerId: string,
    otherUserId: string,
    query: { cursor?: string | null; limit?: number },
  ) {
    if (viewerId === otherUserId) {
      return { items: [], nextCursor: null, hasMore: false, total: 0 };
    }
    if (await this.blocks.isBlockedBetween(viewerId, otherUserId)) {
      throw new ForbiddenError('You cannot view mutual friends');
    }
    const privacy = await this.requests.getPrivacy(otherUserId);
    if ((privacy?.friendsListVisibility ?? 'everyone') === 'only_me') {
      throw new ForbiddenError('Mutual friends are private');
    }
    const [mine, theirs] = await Promise.all([
      this.requests.listAcceptedFriendIds(viewerId),
      this.requests.listAcceptedFriendIds(otherUserId),
    ]);
    const ids = mutualFriendIds(mine, theirs).sort();
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);
    const start = query.cursor ? Math.max(ids.indexOf(query.cursor) + 1, 0) : 0;
    const pageIds = ids.slice(start, start + limit);
    const profiles = await this.requests.listProfiles(pageIds);
    const byId = new Map(profiles.map((profile) => [profile.id, profile]));
    const hasMore = start + limit < ids.length;
    return {
      total: ids.length,
      items: pageIds.map((id) => byId.get(id)).filter(Boolean),
      nextCursor: hasMore ? pageIds[pageIds.length - 1] : null,
      hasMore,
    };
  }
}

@Injectable()
export class ListFriendSuggestionsUseCase {
  constructor(
    @Inject(CONNECTION_REQUEST_REPOSITORY)
    private readonly requests: IConnectionRequestRepository,
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(USER_BLOCK_READER) private readonly blocks: IUserBlockReader,
  ) {}

  async execute(userId: string, limit = 20) {
    const me = await this.users.findById(userId);
    const friendIds = await this.requests.listAcceptedFriendIds(userId);
    const friendSet = new Set(friendIds);
    const edges = await this.requests.listAcceptedEdges(friendIds);
    const hidden = new Set(await this.blocks.listHiddenUserIds(userId));
    const pending = new Set(
      (await this.requests.listForUser(userId))
        .filter((row) => row.status === 'pending')
        .map((row) => otherParticipant(row, userId)),
    );
    const mutuals = new Map<string, Set<string>>();
    for (const edge of edges) {
      const candidates: Array<[string, string]> = [
        [edge.senderId, edge.recipientId],
        [edge.recipientId, edge.senderId],
      ];
      for (const [through, candidate] of candidates) {
        if (!friendSet.has(through) || friendSet.has(candidate)) continue;
        if (
          candidate === userId ||
          hidden.has(candidate) ||
          pending.has(candidate)
        )
          continue;
        const bucket = mutuals.get(candidate) ?? new Set<string>();
        bucket.add(through);
        mutuals.set(candidate, bucket);
      }
    }
    const candidateIds = [...mutuals.keys()];
    const policies = await this.requests.listRequestPolicies(candidateIds);
    for (const policy of policies) {
      if (policy.friendRequestPolicy === 'nobody') mutuals.delete(policy.id);
    }
    const profiles = await this.requests.listProfiles([...mutuals.keys()]);
    const ranked = rankFriendSuggestions(
      profiles
        .filter((profile) => mutuals.has(profile.id))
        .map((profile) => ({
          userId: profile.id,
          mutualFriendIds: [...(mutuals.get(profile.id) ?? [])],
          sameBreed: Boolean(
            me?.pet?.breed &&
            profile.petBreed &&
            me.pet.breed.toLowerCase() === profile.petBreed.toLowerCase(),
          ),
          distanceKm:
            me?.latitude != null &&
            me.longitude != null &&
            profile.latitude != null &&
            profile.longitude != null
              ? haversineKm(
                  me.latitude,
                  me.longitude,
                  profile.latitude,
                  profile.longitude,
                )
              : null,
        })),
    ).slice(0, Math.min(Math.max(limit, 1), 50));
    const byId = new Map(profiles.map((profile) => [profile.id, profile]));
    return ranked.flatMap((item) => {
      const user = byId.get(item.userId);
      if (!user) return [];
      return [
        {
          user,
          mutualFriendCount: item.mutualFriendIds.length,
          sameBreed: item.sameBreed,
          distanceKm: item.distanceKm,
          livesNearby: item.distanceKm != null && item.distanceKm <= 25,
        },
      ];
    });
  }
}

@Injectable()
export class GetFriendshipPrivacyUseCase {
  constructor(
    @Inject(CONNECTION_REQUEST_REPOSITORY)
    private readonly requests: IConnectionRequestRepository,
  ) {}

  async execute(userId: string) {
    const privacy = await this.requests.getPrivacy(userId);
    if (!privacy) throw new NotFoundError('User not found');
    return privacy;
  }
}

@Injectable()
export class UpdateFriendshipPrivacyUseCase {
  constructor(
    @Inject(CONNECTION_REQUEST_REPOSITORY)
    private readonly requests: IConnectionRequestRepository,
  ) {}

  execute(
    userId: string,
    patch: {
      friendRequestPolicy?: FriendRequestPolicyValue;
      friendsListVisibility?: FriendsListVisibilityValue;
      defaultPostVisibility?: PostVisibilityValue;
    },
  ) {
    return this.requests.updatePrivacy(userId, patch);
  }
}
