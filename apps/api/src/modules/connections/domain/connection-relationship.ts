import {
  ConnectionTypeValue,
  RequestStatusValue,
} from '../../../shared/domain/types';

export type ProfileConnectionStatus =
  | 'none'
  | 'outgoing'
  | 'incoming'
  | 'connected'
  | 'blocked';

export type ProfileConnectionView = {
  status: ProfileConnectionStatus;
  requestId: string | null;
};

export type ConnectionPairRow = {
  id: string;
  senderId: string;
  recipientId: string;
  type: ConnectionTypeValue;
  status: RequestStatusValue;
};

export type ConnectionCreatePlan =
  | { kind: 'create' }
  | { kind: 'return'; id: string }
  | { kind: 'reopen'; id: string }
  /** The other person already asked. Surface that request; do not create a second one. */
  | { kind: 'surface-incoming'; id: string }
  | { kind: 'conflict'; message: string };

export type FriendshipActionResult =
  | 'ok'
  | 'not-found'
  | 'forbidden'
  | 'not-pending'
  | 'not-friends';

/** How the viewer relates to another person across pending and accepted requests. */
export function connectionWithUser(
  viewerId: string,
  rows: ConnectionPairRow[],
): ProfileConnectionView {
  const accepted = rows.find((row) => row.status === 'accepted');
  if (accepted) return { status: 'connected', requestId: accepted.id };

  const incoming = rows.find(
    (row) => row.status === 'pending' && row.recipientId === viewerId,
  );
  if (incoming) return { status: 'incoming', requestId: incoming.id };

  const outgoing = rows.find(
    (row) => row.status === 'pending' && row.senderId === viewerId,
  );
  if (outgoing) return { status: 'outgoing', requestId: outgoing.id };

  return { status: 'none', requestId: null };
}

/** Decide whether a new friendship request is created, resumed, or refused. */
export function planCreateConnection(
  senderId: string,
  type: ConnectionTypeValue,
  rows: ConnectionPairRow[],
): ConnectionCreatePlan {
  const current = connectionWithUser(senderId, rows);
  if (current.status === 'connected') {
    return { kind: 'conflict', message: 'Already connected' };
  }
  if (current.status === 'incoming' && current.requestId) {
    return { kind: 'surface-incoming', id: current.requestId };
  }
  if (current.status === 'outgoing' && current.requestId) {
    return { kind: 'return', id: current.requestId };
  }

  const rejected = rows.find(
    (row) =>
      (row.status === 'rejected' ||
        row.status === 'cancelled' ||
        row.status === 'removed') &&
      row.senderId === senderId &&
      row.type === type,
  );
  if (rejected) return { kind: 'reopen', id: rejected.id };
  return { kind: 'create' };
}

export function authorizeAccept(
  row: ConnectionPairRow | null,
  actorId: string,
): FriendshipActionResult {
  if (!row) return 'not-found';
  if (row.recipientId !== actorId) return 'forbidden';
  if (row.status !== 'pending') return 'not-pending';
  return 'ok';
}

export function authorizeDecline(
  row: ConnectionPairRow | null,
  actorId: string,
): FriendshipActionResult {
  if (!row) return 'not-found';
  if (row.recipientId !== actorId) return 'forbidden';
  if (row.status !== 'pending') return 'not-pending';
  return 'ok';
}

export function authorizeCancel(
  row: ConnectionPairRow | null,
  actorId: string,
): FriendshipActionResult {
  if (!row) return 'not-found';
  if (row.senderId !== actorId) return 'forbidden';
  if (row.status !== 'pending') return 'not-pending';
  return 'ok';
}

export function authorizeUnfriend(
  row: ConnectionPairRow | null,
  actorId: string,
): FriendshipActionResult {
  if (!row || row.status !== 'accepted') return 'not-friends';
  if (row.senderId !== actorId && row.recipientId !== actorId)
    return 'forbidden';
  return 'ok';
}
