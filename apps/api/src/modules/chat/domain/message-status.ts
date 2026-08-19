export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  DELETED = 'DELETED',
  FAILED = 'FAILED',
}

export function isMessageVisible(status: MessageStatus): boolean {
  return status !== MessageStatus.DELETED;
}
