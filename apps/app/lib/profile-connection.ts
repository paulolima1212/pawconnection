export type ProfileConnectionStatus =
  | 'none'
  | 'outgoing'
  | 'incoming'
  | 'connected'
  | 'blocked';

export type ProfileConnection = {
  status: ProfileConnectionStatus;
  requestId: string | null;
};

export function connectButtonLabel(status: ProfileConnectionStatus): string {
  switch (status) {
    case 'outgoing':
      return 'Request sent';
    case 'incoming':
      return 'Accept';
    case 'connected':
      return 'Friends';
    case 'blocked':
      return 'Blocked';
    default:
      return 'Add Friend';
  }
}

/** Add Friend sends a request. Accept confirms one that was received. */
export function connectButtonEnabled(status: ProfileConnectionStatus): boolean {
  return status === 'none' || status === 'incoming';
}

export function showCancelRequest(status: ProfileConnectionStatus): boolean {
  return status === 'outgoing';
}

export function showDeclineRequest(status: ProfileConnectionStatus): boolean {
  return status === 'incoming';
}

export function showUnfriend(status: ProfileConnectionStatus): boolean {
  return status === 'connected';
}

export function unfriendConfirmMessage(name: string): string {
  return `Remove ${name} from your friends?`;
}
