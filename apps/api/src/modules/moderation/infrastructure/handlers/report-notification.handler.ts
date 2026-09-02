import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DomainEvent } from '../../../../shared/events/domain-event';
import { IEventHandler } from '../../../../shared/events/event-bus';
import {
  EMAIL_SENDER,
  IEmailSender,
} from '../../../../shared/domain/ports/email-sender.port';
import {
  MODERATION_EVENTS,
  PostReportedPayload,
} from '../../domain/events/moderation-events';
import {
  IModerationPostReader,
  MODERATION_POST_READER,
} from '../../domain/ports/post-reader.port';
import {
  IModerationUserReader,
  MODERATION_USER_READER,
} from '../../domain/ports/user-reader.port';

@Injectable()
export class ReportNotificationHandler implements IEventHandler {
  readonly handlerName = 'moderation-report-email';
  private readonly logger = new Logger(ReportNotificationHandler.name);

  constructor(
    @Inject(EMAIL_SENDER) private readonly email: IEmailSender,
    @Inject(MODERATION_POST_READER) private readonly posts: IModerationPostReader,
    @Inject(MODERATION_USER_READER) private readonly users: IModerationUserReader,
    private readonly config: ConfigService,
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    if (event.eventType !== MODERATION_EVENTS.POST_REPORTED) return;

    const inbox = this.config.get<string>('REPORTS_INBOX_EMAIL')?.trim();
    if (!inbox) {
      this.logger.warn({
        msg: 'moderation.report_email_skipped',
        reason: 'REPORTS_INBOX_EMAIL is not configured',
        reportId: (event.payload as PostReportedPayload).reportId,
      });
      return;
    }

    const payload = event.payload as PostReportedPayload;
    const snapshot = await this.posts.getSnapshot(payload.postId);
    const [reporter] = await this.users.findSummariesByIds([payload.reporterId]);
    const body = snapshot?.body?.trim() || '(no text)';
    const images = snapshot?.imageUrls?.length
      ? snapshot.imageUrls.join('\n')
      : '(none)';
    const authorHandle = snapshot?.authorHandle
      ? `@${snapshot.authorHandle}`
      : payload.postAuthorId;
    const reporterHandle = reporter?.handle ? `@${reporter.handle}` : payload.reporterId;

    const text = [
      'A publication was reported in Paw Connection.',
      '',
      `Report id: ${payload.reportId}`,
      `Reason: ${payload.reason}`,
      `Details: ${payload.details ?? '(none)'}`,
      `Post id: ${payload.postId}`,
      `Author: ${snapshot?.authorName ?? payload.postAuthorId} (${authorHandle})`,
      `Reporter: ${reporter?.fullName ?? payload.reporterId} (${reporterHandle})`,
      '',
      'Reported content:',
      body,
      '',
      'Image URLs:',
      images,
    ].join('\n');

    await this.email.send({
      to: inbox,
      subject: `[Paw Connection] Post reported (${payload.reason})`,
      text,
      html: `<pre>${escapeHtml(text)}</pre>`,
    });
    this.logger.log({
      msg: 'moderation.report_email_sent',
      reportId: payload.reportId,
      postId: payload.postId,
    });
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
