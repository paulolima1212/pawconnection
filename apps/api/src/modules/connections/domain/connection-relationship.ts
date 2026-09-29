import {
  ConnectionTypeValue,
  RequestStatusValue,
} from '../../../shared/domain/types';

export type ProfileConnectionStatus = 'none' | 'outgoing' | 'incoming' | 'connected';

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
  | { kind: 'conflict'; message: string };

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
  if (current.status === 'incoming') {
    return {
      kind: 'conflict',
      message: 'This person already sent you a request',
    };
  }
  if (current.status === 'outgoing' && current.requestId) {
    return { kind: 'return', id: current.requestId };
  }

  const rejected = rows.find(
    (row) => row.status === 'rejected' && row.senderId === senderId && row.type === type,
  );
  if (rejected) return { kind: 'reopen', id: rejected.id };
  return { kind: 'create' };
}
