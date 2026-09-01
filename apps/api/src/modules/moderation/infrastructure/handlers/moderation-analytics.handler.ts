import { Injectable, Logger } from '@nestjs/common';
import { DomainEvent, serializeEvent } from '../../../../shared/events/domain-event';
import { IEventHandler } from '../../../../shared/events/event-bus';

@Injectable()
export class ModerationAnalyticsHandler implements IEventHandler {
  readonly handlerName = 'moderation-analytics';
  private readonly logger = new Logger(ModerationAnalyticsHandler.name);

  handle(event: DomainEvent): void {
    this.logger.log({
      msg: 'analytics.moderation_event',
      ...serializeEvent(event),
    });
  }
}
