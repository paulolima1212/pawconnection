import { BaseDomainEvent, EventMetadata } from '../../../../shared/events/domain-event';

export const PROFILE_EVENTS = {
  ACCOUNT_DELETED: 'profile.account_deleted',
} as const;

export interface AccountDeletedPayload {
  userId: string;
  handle: string;
  mediaUrlCount: number;
}

export class AccountDeletedEvent extends BaseDomainEvent<AccountDeletedPayload> {
  readonly eventType = PROFILE_EVENTS.ACCOUNT_DELETED;
  constructor(payload: AccountDeletedPayload, metadata?: EventMetadata) {
    super(payload.userId, payload, { source: 'profile', ...metadata });
  }
}
