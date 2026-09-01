import { Injectable, Logger } from '@nestjs/common';
import { DomainEvent, serializeEvent } from '../../../../shared/events/domain-event';
import { IEventHandler } from '../../../../shared/events/event-bus';

@Injectable()
export class AccountDeletedAnalyticsHandler implements IEventHandler {
  readonly handlerName = 'profile-account-deleted-analytics';
  private readonly logger = new Logger(AccountDeletedAnalyticsHandler.name);

  handle(event: DomainEvent): void {
    this.logger.log({
      msg: 'analytics.account_deleted',
      ...serializeEvent(event),
    });
  }
}
