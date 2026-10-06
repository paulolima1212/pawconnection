import { Injectable, Logger } from '@nestjs/common';
import { IEventHandler } from '../../../../shared/events/event-bus';
import { DomainEvent } from '../../../../shared/events/domain-event';
import { FRIENDSHIP_EVENTS } from '../../domain/events/friendship-events';

const COPY: Record<string, string> = {
  [FRIENDSHIP_EVENTS.REQUEST_SENT]: 'sent you a friend request.',
  [FRIENDSHIP_EVENTS.REQUEST_ACCEPTED]: 'accepted your friend request.',
};

/**
 * Records a notification intent. Push delivery stays with the existing
 * notification transport, which today logs the dispatch.
 */
@Injectable()
export class FriendshipNotificationHandler implements IEventHandler {
  readonly handlerName = 'friendship-notification';
  private readonly logger = new Logger(FriendshipNotificationHandler.name);

  handle(event: DomainEvent): void {
    const payload = event.payload as {
      actorId?: string;
      otherUserId?: string;
      requestId?: string;
    };
    const text = COPY[event.eventType];
    if (
      !text ||
      !payload.otherUserId ||
      payload.otherUserId === payload.actorId
    )
      return;
    const recipientId = payload.otherUserId;
    this.logger.log({
      msg: 'notification.dispatch',
      kind: event.eventType,
      recipientId,
      actorId: payload.actorId,
      requestId: payload.requestId,
      text,
      screen: 'friends',
    });
  }
}

@Injectable()
export class FriendshipAnalyticsHandler implements IEventHandler {
  readonly handlerName = 'friendship-analytics';
  private readonly logger = new Logger(FriendshipAnalyticsHandler.name);

  handle(event: DomainEvent): void {
    const payload = event.payload as { requestId?: string };
    const names: Record<string, string> = {
      [FRIENDSHIP_EVENTS.REQUEST_SENT]: 'friend_request_sent',
      [FRIENDSHIP_EVENTS.REQUEST_ACCEPTED]: 'friend_request_accepted',
      [FRIENDSHIP_EVENTS.REQUEST_DECLINED]: 'friend_request_declined',
      [FRIENDSHIP_EVENTS.REQUEST_CANCELLED]: 'friend_request_cancelled',
      [FRIENDSHIP_EVENTS.REMOVED]: 'friend_removed',
    };
    this.logger.log({
      msg: 'analytics.event',
      name: names[event.eventType] ?? event.eventType,
      requestId: payload.requestId,
    });
  }
}
