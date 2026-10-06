import {
  authorizeAccept,
  authorizeCancel,
  authorizeDecline,
  authorizeUnfriend,
  connectionWithUser,
  planCreateConnection,
  type ConnectionPairRow,
} from './connection-relationship';

const viewer = 'viewer';
const other = 'other';

function row(
  partial: Partial<ConnectionPairRow> &
    Pick<ConnectionPairRow, 'id' | 'status'>,
): ConnectionPairRow {
  return {
    senderId: viewer,
    recipientId: other,
    type: 'friendship',
    ...partial,
  };
}

describe('connectionWithUser', () => {
  it('GivenNoRequest_WhenViewingProfile_ThenStatusIsNone', () => {
    expect(connectionWithUser(viewer, [])).toEqual({
      status: 'none',
      requestId: null,
    });
  });

  it('GivenOutgoingPending_WhenViewingProfile_ThenStatusIsOutgoing', () => {
    expect(
      connectionWithUser(viewer, [row({ id: 'req-1', status: 'pending' })]),
    ).toEqual({ status: 'outgoing', requestId: 'req-1' });
  });

  it('GivenIncomingPending_WhenViewingProfile_ThenStatusIsIncoming', () => {
    expect(
      connectionWithUser(viewer, [
        row({
          id: 'req-2',
          status: 'pending',
          senderId: other,
          recipientId: viewer,
        }),
      ]),
    ).toEqual({ status: 'incoming', requestId: 'req-2' });
  });

  it('GivenAcceptedRequest_WhenViewingProfile_ThenStatusIsConnected', () => {
    expect(
      connectionWithUser(viewer, [
        row({
          id: 'req-3',
          status: 'accepted',
          senderId: other,
          recipientId: viewer,
        }),
      ]),
    ).toEqual({ status: 'connected', requestId: 'req-3' });
  });

  it('GivenOnlyRejectedRequest_WhenViewingProfile_ThenStatusIsNone', () => {
    expect(
      connectionWithUser(viewer, [row({ id: 'req-4', status: 'rejected' })]),
    ).toEqual({
      status: 'none',
      requestId: null,
    });
  });
});

describe('planCreateConnection', () => {
  it('GivenNoRequest_WhenConnecting_ThenCreates', () => {
    expect(planCreateConnection(viewer, 'friendship', [])).toEqual({
      kind: 'create',
    });
  });

  it('GivenOutgoingPending_WhenConnecting_ThenReturnsExisting', () => {
    expect(
      planCreateConnection(viewer, 'friendship', [
        row({ id: 'req-1', status: 'pending' }),
      ]),
    ).toEqual({ kind: 'return', id: 'req-1' });
  });

  it('GivenRejectedOutgoing_WhenConnecting_ThenReopens', () => {
    expect(
      planCreateConnection(viewer, 'friendship', [
        row({ id: 'req-4', status: 'rejected' }),
      ]),
    ).toEqual({ kind: 'reopen', id: 'req-4' });
  });

  it('GivenAlreadyConnected_WhenConnecting_ThenConflicts', () => {
    expect(
      planCreateConnection(viewer, 'friendship', [
        row({ id: 'req-3', status: 'accepted' }),
      ]),
    ).toEqual({ kind: 'conflict', message: 'Already connected' });
  });

  it('GivenIncomingPending_WhenConnecting_ThenSurfacesExistingRequest', () => {
    expect(
      planCreateConnection(viewer, 'friendship', [
        row({
          id: 'req-2',
          status: 'pending',
          senderId: other,
          recipientId: viewer,
        }),
      ]),
    ).toEqual({ kind: 'surface-incoming', id: 'req-2' });
  });

  it('GivenCancelledOutgoing_WhenConnecting_ThenReopens', () => {
    expect(
      planCreateConnection(viewer, 'friendship', [
        row({ id: 'req-5', status: 'cancelled' }),
      ]),
    ).toEqual({ kind: 'reopen', id: 'req-5' });
  });
});

describe('friendship action authorization', () => {
  const pending = row({ id: 'req-1', status: 'pending' });
  const incoming = row({
    id: 'req-2',
    status: 'pending',
    senderId: other,
    recipientId: viewer,
  });
  const accepted = row({ id: 'req-3', status: 'accepted' });

  it('only the recipient accepts or declines a pending request', () => {
    expect(authorizeAccept(pending, other)).toBe('ok');
    expect(authorizeAccept(pending, viewer)).toBe('forbidden');
    expect(authorizeAccept(accepted, other)).toBe('not-pending');
    expect(authorizeDecline(incoming, viewer)).toBe('ok');
    expect(authorizeDecline(incoming, other)).toBe('forbidden');
  });

  it('only the sender cancels, and either friend can unfriend', () => {
    expect(authorizeCancel(pending, viewer)).toBe('ok');
    expect(authorizeCancel(pending, other)).toBe('forbidden');
    expect(authorizeUnfriend(accepted, viewer)).toBe('ok');
    expect(authorizeUnfriend(accepted, other)).toBe('ok');
    expect(authorizeUnfriend(pending, viewer)).toBe('not-friends');
  });
});
