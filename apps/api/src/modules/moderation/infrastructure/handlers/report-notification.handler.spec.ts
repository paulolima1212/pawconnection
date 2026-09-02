import { ConfigService } from '@nestjs/config';
import {
  EMAIL_SENDER,
  IEmailSender,
} from '../../../../shared/domain/ports/email-sender.port';
import { PostReportedEvent } from '../../domain/events/moderation-events';
import { ReportedPostSnapshot } from '../../domain/ports/post-reader.port';
import { IModerationUserReader, ModerationUserSummary } from '../../domain/ports/user-reader.port';
import { ReportNotificationHandler } from './report-notification.handler';

class FakeEmail implements IEmailSender {
  readonly sent: { to: string; subject: string; text: string }[] = [];
  async send(message: { to: string; subject: string; text: string }): Promise<void> {
    this.sent.push(message);
  }
}

class FakePosts {
  constructor(private readonly snapshot: ReportedPostSnapshot | null) {}
  async getAuthorId(): Promise<string | null> {
    return this.snapshot?.authorId ?? null;
  }
  async getSnapshot(): Promise<ReportedPostSnapshot | null> {
    return this.snapshot;
  }
}

class FakeUsers implements IModerationUserReader {
  constructor(private readonly users: ModerationUserSummary[]) {}
  async exists(userId: string): Promise<boolean> {
    return this.users.some((u) => u.id === userId);
  }
  async findSummariesByIds(ids: string[]): Promise<ModerationUserSummary[]> {
    return this.users.filter((u) => ids.includes(u.id));
  }
}

describe('ReportNotificationHandler', () => {
  const snapshot: ReportedPostSnapshot = {
    id: 'post-1',
    body: 'Reported body text',
    imageUrls: ['https://cdn.example/p.jpg'],
    authorId: 'author',
    authorHandle: 'authorhandle',
    authorName: 'Author Name',
  };
  const reporter = { id: 'viewer', fullName: 'Viewer', handle: 'viewer', photoUrl: null };

  it('emails the reports inbox with the reported content', async () => {
    const email = new FakeEmail();
    const config = { get: (key: string) => (key === 'REPORTS_INBOX_EMAIL' ? 'dev@paw.test' : undefined) };
    const handler = new ReportNotificationHandler(
      email,
      new FakePosts(snapshot) as never,
      new FakeUsers([reporter]),
      config as ConfigService,
    );

    await handler.handle(
      new PostReportedEvent({
        reportId: 'r1',
        postId: 'post-1',
        reporterId: 'viewer',
        postAuthorId: 'author',
        reason: 'spam',
        details: 'too many ads',
      }),
    );

    expect(email.sent).toHaveLength(1);
    expect(email.sent[0].to).toBe('dev@paw.test');
    expect(email.sent[0].text).toContain('Reported body text');
    expect(email.sent[0].text).toContain('too many ads');
    expect(email.sent[0].text).toContain('@authorhandle');
  });

  it('skips sending when REPORTS_INBOX_EMAIL is unset', async () => {
    const email = new FakeEmail();
    const config = { get: () => undefined };
    const handler = new ReportNotificationHandler(
      email,
      new FakePosts(snapshot) as never,
      new FakeUsers([reporter]),
      config as ConfigService,
    );

    await handler.handle(
      new PostReportedEvent({
        reportId: 'r1',
        postId: 'post-1',
        reporterId: 'viewer',
        postAuthorId: 'author',
        reason: 'spam',
        details: null,
      }),
    );

    expect(email.sent).toHaveLength(0);
  });
});
