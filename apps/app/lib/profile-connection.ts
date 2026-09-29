export type ProfileConnectionStatus = 'none' | 'outgoing' | 'incoming' | 'connected';

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
      return 'Connected';
    default:
      return 'Connect';
  }
}

/** Connect sends a request. Accept confirms one that was received. */
export function connectButtonEnabled(status: ProfileConnectionStatus): boolean {
  return status === 'none' || status === 'incoming';
}
