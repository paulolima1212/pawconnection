import { Injectable, Logger } from '@nestjs/common';
import { DomainEvent, serializeEvent } from '../../../../shared/events/domain-event';
import { IEventHandler } from '../../../../shared/events/event-bus';

/**
 * Catch-all analytics sink for comment events. Logs a structured analytics line
 * per event; swap the logger for a metrics/event-warehouse client later.
 */
@Injectable()
export class CommentAnalyticsHandler implements IEventHandler {
  readonly handlerName = 'comment-analytics';
  private readonly logger = new Logger(CommentAnalyticsHandler.name);

  handle(event: DomainEvent): void {
    this.logger.log({
      msg: 'analytics.comment_event',
      ...serializeEvent(event),
    });
  }
}
