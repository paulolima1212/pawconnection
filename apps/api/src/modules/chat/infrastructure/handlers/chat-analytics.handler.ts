import { Injectable, Logger } from '@nestjs/common';
import { DomainEvent, serializeEvent } from '../../../../shared/events/domain-event';
import { IEventHandler } from '../../../../shared/events/event-bus';

@Injectable()
export class ChatAnalyticsHandler implements IEventHandler {
  readonly handlerName = 'ChatAnalyticsHandler';
  private readonly logger = new Logger(ChatAnalyticsHandler.name);

  async handle(event: DomainEvent): Promise<void> {
    this.logger.log({
      msg: 'chat.domain_event',
      ...serializeEvent(event),
    });
  }
}
