import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../shared/domain/result';
import { EVENT_BUS, IEventBus } from '../../../shared/events/event-bus';
import { EventMetadata } from '../../../shared/events/domain-event';
import { PostReport } from '../domain/post-report.entity';
import { UserBlock } from '../domain/user-block.entity';
import { UserUnblockedEvent } from '../domain/events/moderation-events';
import {
  IPostReportRepository,
  POST_REPORT_REPOSITORY,
} from '../domain/repositories/post-report.repository';
import {
  IUserBlockRepository,
  USER_BLOCK_REPOSITORY,
} from '../domain/repositories/user-block.repository';
import {
  IModerationPostReader,
  MODERATION_POST_READER,
} from '../domain/ports/post-reader.port';
import {
  IModerationUserReader,
  MODERATION_USER_READER,
  ModerationUserSummary,
} from '../domain/ports/user-reader.port';

export interface ModerationRequestContext {
  userId: string;
  correlationId?: string;
}

function metaOf(ctx: ModerationRequestContext): EventMetadata {
  return { correlationId: ctx.correlationId, userId: ctx.userId, source: 'moderation' };
}

async function flush(bus: IEventBus, entity: { pullEvents: () => Parameters<IEventBus['publishAll']>[0] }): Promise<void> {
  const events = entity.pullEvents();
  if (events.length) await bus.publishAll(events);
}

export type ReportPostResult = {
  reported: true;
  reportId: string;
  duplicate: boolean;
};

@Injectable()
export class ReportPostUseCase {
  private readonly logger = new Logger(ReportPostUseCase.name);

  constructor(
    @Inject(POST_REPORT_REPOSITORY) private readonly reports: IPostReportRepository,
    @Inject(MODERATION_POST_READER) private readonly posts: IModerationPostReader,
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
  ) {}

  async execute(
    input: { postId: string; reason: string; details?: string | null },
    ctx: ModerationRequestContext,
  ): Promise<ReportPostResult> {
    const postAuthorId = await this.posts.getAuthorId(input.postId);
    if (!postAuthorId) throw new NotFoundError('Post not found');

    const existing = await this.reports.findByReporterAndPost(ctx.userId, input.postId);
    if (existing) {
      return { reported: true, reportId: existing.id, duplicate: true };
    }

    const report = PostReport.create({
      reporterId: ctx.userId,
      postId: input.postId,
      postAuthorId,
      reason: input.reason,
      details: input.details,
      metadata: metaOf(ctx),
    });

    try {
      await this.reports.save(report);
    } catch {
      const raced = await this.reports.findByReporterAndPost(ctx.userId, input.postId);
      if (raced) {
        return { reported: true, reportId: raced.id, duplicate: true };
      }
      throw new ConflictError('Could not save report');
    }

    await flush(this.bus, report);
    this.logger.log({
      msg: 'moderation.post_reported',
      reportId: report.id,
      postId: report.postId,
      reporterId: ctx.userId,
      correlationId: ctx.correlationId,
    });
    return { reported: true, reportId: report.id, duplicate: false };
  }
}

@Injectable()
export class BlockUserUseCase {
  private readonly logger = new Logger(BlockUserUseCase.name);

  constructor(
    @Inject(USER_BLOCK_REPOSITORY) private readonly blocks: IUserBlockRepository,
    @Inject(MODERATION_USER_READER) private readonly users: IModerationUserReader,
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
  ) {}

  async execute(
    blockedUserId: string,
    ctx: ModerationRequestContext,
  ): Promise<{ blocked: true }> {
    const exists = await this.users.exists(blockedUserId);
    if (!exists) throw new NotFoundError('User not found');

    const already = await this.blocks.findByPair(ctx.userId, blockedUserId);
    if (already) {
      return { blocked: true };
    }

    const block = UserBlock.create({
      blockerId: ctx.userId,
      blockedId: blockedUserId,
      metadata: metaOf(ctx),
    });
    await this.blocks.save(block);
    await flush(this.bus, block);
    this.logger.log({
      msg: 'moderation.user_blocked',
      blockerId: ctx.userId,
      blockedId: blockedUserId,
      correlationId: ctx.correlationId,
    });
    return { blocked: true };
  }
}

@Injectable()
export class UnblockUserUseCase {
  private readonly logger = new Logger(UnblockUserUseCase.name);

  constructor(
    @Inject(USER_BLOCK_REPOSITORY) private readonly blocks: IUserBlockRepository,
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
  ) {}

  async execute(
    blockedUserId: string,
    ctx: ModerationRequestContext,
  ): Promise<{ unblocked: true }> {
    const removed = await this.blocks.delete(ctx.userId, blockedUserId);
    if (removed) {
      await this.bus.publish(
        new UserUnblockedEvent(
          { blockerId: ctx.userId, blockedId: blockedUserId },
          metaOf(ctx),
        ),
      );
      this.logger.log({
        msg: 'moderation.user_unblocked',
        blockerId: ctx.userId,
        blockedId: blockedUserId,
        correlationId: ctx.correlationId,
      });
    }
    return { unblocked: true };
  }
}

export type BlockedUserListItem = ModerationUserSummary & { blockedAt: Date };

@Injectable()
export class ListBlockedUsersUseCase {
  constructor(
    @Inject(USER_BLOCK_REPOSITORY) private readonly blocks: IUserBlockRepository,
    @Inject(MODERATION_USER_READER) private readonly users: IModerationUserReader,
  ) {}

  async execute(ctx: ModerationRequestContext): Promise<{ items: BlockedUserListItem[] }> {
    const rows = await this.blocks.listBlockedBy(ctx.userId);
    const summaries = await this.users.findSummariesByIds(rows.map((r) => r.blockedId));
    const byId = new Map(summaries.map((s) => [s.id, s]));
    const items: BlockedUserListItem[] = [];
    for (const row of rows) {
      const summary = byId.get(row.blockedId);
      if (!summary) continue;
      items.push({ ...summary, blockedAt: row.createdAt });
    }
    return { items };
  }
}

export async function assertNotBlocked(
  isBlocked: Promise<boolean> | boolean,
  message = 'You cannot interact with this user',
): Promise<void> {
  const blocked = typeof isBlocked === 'boolean' ? isBlocked : await isBlocked;
  if (blocked) throw new ForbiddenError(message);
}
