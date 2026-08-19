import { Inject, Injectable } from '@nestjs/common';
import {
  AppConnectionIntent,
  ConnectionTypeValue,
  RequestDirection,
} from '../../../shared/domain/types';
import { ConflictError, NotFoundError, ValidationError } from '../../../shared/domain/result';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../profile/domain/repositories/user.repository';
import {
  directionSpec,
  PendingRequestsSpec,
  RequestsByTypeSpec,
} from '../domain/specifications/connection-request.spec';
import { connectionTypeFromLookingFor } from '../domain/connection-intent.mapper';
import {
  CONNECTION_REQUEST_REPOSITORY,
  IConnectionRequestRepository,
} from '../domain/repositories/connection-request.repository';

@Injectable()
export class ListInboxRequestsUseCase {
  constructor(
    @Inject(CONNECTION_REQUEST_REPOSITORY)
    private readonly requests: IConnectionRequestRepository,
  ) {}

  async execute(
    userId: string,
    filters: { type?: ConnectionTypeValue; direction?: RequestDirection },
  ) {
    let items = await this.requests.listForUser(userId);
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
  ) {}

  execute(id: string, userId: string) {
    return this.requests.accept(id, userId);
  }
}

@Injectable()
export class RejectConnectionRequestUseCase {
  constructor(
    @Inject(CONNECTION_REQUEST_REPOSITORY)
    private readonly requests: IConnectionRequestRepository,
  ) {}

  execute(id: string, userId: string) {
    return this.requests.reject(id, userId);
  }
}

@Injectable()
export class CreateConnectionRequestUseCase {
  constructor(
    @Inject(CONNECTION_REQUEST_REPOSITORY)
    private readonly requests: IConnectionRequestRepository,
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(
    senderId: string,
    recipientId: string,
    lookingFor: AppConnectionIntent,
  ) {
    if (senderId === recipientId) {
      throw new ValidationError('Cannot connect with yourself');
    }

    const recipient = await this.users.findById(recipientId);
    if (!recipient) {
      throw new NotFoundError('User not found');
    }

    const type: ConnectionTypeValue = connectionTypeFromLookingFor(lookingFor);
    const existing = (await this.requests.listForUser(senderId)).find(
      (r) =>
        r.senderId === senderId &&
        r.recipientId === recipientId &&
        r.type === type &&
        r.status === 'pending',
    );
    if (existing) {
      return existing;
    }

    try {
      return await this.requests.create(senderId, recipientId, type);
    } catch {
      throw new ConflictError('Connection request already exists');
    }
  }
}
