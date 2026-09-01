import { ValidationError } from '../../../shared/domain/result';
import { MODERATION_EVENTS } from './events/moderation-events';
import { PostReport, REPORT_DETAILS_MAX_LENGTH } from './post-report.entity';

describe('PostReport', () => {
  const base = {
    reporterId: 'viewer',
    postId: 'post-1',
    postAuthorId: 'author',
    reason: 'spam',
  };

  it('creates a pending report and records PostReported', () => {
    const report = PostReport.create(base);
    expect(report.status).toBe('pending');
    expect(report.reason).toBe('spam');
    expect(report.details).toBeNull();
    const events = report.pullEvents();
    expect(events.map((e) => e.eventType)).toEqual([MODERATION_EVENTS.POST_REPORTED]);
  });

  it('rejects reporting your own post', () => {
    expect(() =>
      PostReport.create({ ...base, reporterId: 'author', postAuthorId: 'author' }),
    ).toThrow(ValidationError);
  });

  it('rejects an unknown reason', () => {
    expect(() => PostReport.create({ ...base, reason: 'not-a-reason' })).toThrow(
      /invalid report reason/i,
    );
  });

  it('trims details and rejects overly long notes', () => {
    const report = PostReport.create({ ...base, details: '  too many photos  ' });
    expect(report.details).toBe('too many photos');

    expect(() =>
      PostReport.create({
        ...base,
        details: 'x'.repeat(REPORT_DETAILS_MAX_LENGTH + 1),
      }),
    ).toThrow(/at most/i);
  });
});
