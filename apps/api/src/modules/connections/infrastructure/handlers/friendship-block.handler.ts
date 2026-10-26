import { Inject, Injectable } from '@nestjs/common';
import { IEventHandler } from '../../../../shared/events/event-bus';
import { UserBlockedEvent } from '../../../moderation/domain/events/moderation-events';
import {
  CONNECTION_REQUEST_REPOSITORY,
  IConnectionRequestRepository,
} from '../../domain/repositories/connection-request.repository';

/** Ending a block also ends a pending request or an accepted friendship. */
@Injectable()
export class FriendshipBlockHandler implements IEventHandler<UserBlockedEvent> {
  readonly handlerName = 'friendship-block';

  constructor(
    @Inject(CONNECTION_REQUEST_REPOSITORY)
    private readonly requests: IConnectionRequestRepository,
  ) {}

  async handle(event: UserBlockedEvent): Promise<void> {
    await this.requests.deactivateBetween(
      event.payload.blockerId,
      event.payload.blockedId,
    );
  }
}
