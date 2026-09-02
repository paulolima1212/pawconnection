import { randomUUID } from 'crypto';
import { DomainEvent, EventMetadata } from '../../../shared/events/domain-event';
import { ValidationError } from '../../../shared/domain/result';
import { PostReportedEvent } from './events/moderation-events';
import { isReportReason, ReportReason } from './report-reason';
import { ReportStatus } from './report-status';

export const REPORT_DETAILS_MAX_LENGTH = 500;

export interface PostReportState {
  id: string;
  reporterId: string;
  postId: string;
  postAuthorId: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Post report aggregate. A viewer flags a publication for review.
 * One reporter may file at most one report per post (enforced by persistence).
 */
export class PostReport {
  private readonly _events: DomainEvent[] = [];

  private constructor(private state: PostReportState) {}

  get id(): string {
    return this.state.id;
  }
  get reporterId(): string {
    return this.state.reporterId;
  }
  get postId(): string {
    return this.state.postId;
  }
  get postAuthorId(): string {
    return this.state.postAuthorId;
  }
  get reason(): ReportReason {
    return this.state.reason;
  }
  get details(): string | null {
    return this.state.details;
  }
  get status(): ReportStatus {
    return this.state.status;
  }
  get createdAt(): Date {
    return this.state.createdAt;
  }

  toState(): PostReportState {
    return { ...this.state };
  }

  pullEvents(): DomainEvent[] {
    const events = [...this._events];
    this._events.length = 0;
    return events;
  }

  static restore(state: PostReportState): PostReport {
    return new PostReport({ ...state });
  }

  static create(input: {
    reporterId: string;
    postId: string;
    postAuthorId: string;
    reason: string;
    details?: string | null;
    metadata?: EventMetadata;
  }): PostReport {
    if (input.reporterId === input.postAuthorId) {
      throw new ValidationError('You cannot report your own post');
    }
    if (!isReportReason(input.reason)) {
      throw new ValidationError('Invalid report reason');
    }

    const details = normalizeDetails(input.details);
    const now = new Date();
    const report = new PostReport({
      id: randomUUID(),
      reporterId: input.reporterId,
      postId: input.postId,
      postAuthorId: input.postAuthorId,
      reason: input.reason,
      details,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });

    report._events.push(
      new PostReportedEvent(
        {
          reportId: report.id,
          postId: report.postId,
          reporterId: report.reporterId,
          postAuthorId: report.postAuthorId,
          reason: report.reason,
          details: report.details,
        },
        input.metadata,
      ),
    );
    return report;
  }
}

function normalizeDetails(details?: string | null): string | null {
  if (details == null) return null;
  const trimmed = details.trim();
  if (!trimmed) return null;
  if (trimmed.length > REPORT_DETAILS_MAX_LENGTH) {
    throw new ValidationError(
      `Report details must be at most ${REPORT_DETAILS_MAX_LENGTH} characters`,
    );
  }
  return trimmed;
}
