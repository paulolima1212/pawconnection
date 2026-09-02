import {
  ConnectionRequestEntity,
  ConnectionTypeValue,
  RequestDirection,
} from '../../../../shared/domain/types';
import { CompositeSpecification } from '../../../../shared/domain/specification';

export class RequestsByTypeSpec extends CompositeSpecification<ConnectionRequestEntity> {
  constructor(private readonly type: ConnectionTypeValue) {
    super();
  }

  isSatisfiedBy(request: ConnectionRequestEntity): boolean {
    return request.type === this.type;
  }
}

export class IncomingRequestsSpec extends CompositeSpecification<ConnectionRequestEntity> {
  constructor(private readonly userId: string) {
    super();
  }

  isSatisfiedBy(request: ConnectionRequestEntity): boolean {
    return request.recipientId === this.userId;
  }
}

export class OutgoingRequestsSpec extends CompositeSpecification<ConnectionRequestEntity> {
  constructor(private readonly userId: string) {
    super();
  }

  isSatisfiedBy(request: ConnectionRequestEntity): boolean {
    return request.senderId === this.userId;
  }
}

export class PendingRequestsSpec extends CompositeSpecification<ConnectionRequestEntity> {
  isSatisfiedBy(request: ConnectionRequestEntity): boolean {
    return request.status === 'pending';
  }
}

export function directionSpec(
  userId: string,
  direction: RequestDirection,
): CompositeSpecification<ConnectionRequestEntity> {
  return direction === 'incoming'
    ? new IncomingRequestsSpec(userId)
    : new OutgoingRequestsSpec(userId);
}

describe('PendingRequestsSpec', () => {
  it('is satisfied for pending requests', () => {
    expect(
      new PendingRequestsSpec().isSatisfiedBy({ status: 'pending' } as ConnectionRequestEntity),
    ).toBe(true);
  });
});
