import { ConflictError, NotFoundError, ValidationError } from '../../../shared/domain/result';
import { InMemoryDeadLetterQueue } from '../../../shared/events/dead-letter-queue';
import { InMemoryEventBus } from '../../../shared/events/in-memory-event-bus';
import { IEventBus } from '../../../shared/events/event-bus';
import { MODERATION_EVENTS } from '../domain/events/moderation-events';
import { PostReport } from '../domain/post-report.entity';
import { UserBlock } from '../domain/user-block.entity';
import { IPostReportRepository } from '../domain/repositories/post-report.repository';
import {
  BlockedUserRow,
  IUserBlockRepository,
} from '../domain/repositories/user-block.repository';
import { IModerationPostReader } from '../domain/ports/post-reader.port';
import {
  IModerationUserReader,
  ModerationUserSummary,
} from '../domain/ports/user-reader.port';
import {
  BlockUserUseCase,
  ListBlockedUsersUseCase,
  ReportPostUseCase,
  UnblockUserUseCase,
} from './moderation.use-cases';

class InMemoryPostReportRepository implements IPostReportRepository {
  readonly rows = new Map<string, PostReport>();

  key(reporterId: string, postId: string): string {
    return `${reporterId}:${postId}`;
  }

  async findByReporterAndPost(reporterId: string, postId: string): Promise<PostReport | null> {
    const found = this.rows.get(this.key(reporterId, postId));
    return found ? PostReport.restore(found.toState()) : null;
  }

  async save(report: PostReport): Promise<void> {
    const key = this.key(report.reporterId, report.postId);
    if (this.rows.has(key)) throw new ConflictError('duplicate');
    this.rows.set(key, PostReport.restore(report.toState()));
  }
}

class InMemoryUserBlockRepository implements IUserBlockRepository {
  readonly rows = new Map<string, UserBlock>();

  key(blockerId: string, blockedId: string): string {
    return `${blockerId}:${blockedId}`;
  }

  async findByPair(blockerId: string, blockedId: string): Promise<UserBlock | null> {
    const found = this.rows.get(this.key(blockerId, blockedId));
    return found ? UserBlock.restore(found.toState()) : null;
  }

  async save(block: UserBlock): Promise<void> {
    this.rows.set(this.key(block.blockerId, block.blockedId), UserBlock.restore(block.toState()));
  }

  async delete(blockerId: string, blockedId: string): Promise<boolean> {
    return this.rows.delete(this.key(blockerId, blockedId));
  }

  async listBlockedBy(blockerId: string): Promise<BlockedUserRow[]> {
    return [...this.rows.values()]
      .filter((b) => b.blockerId === blockerId)
      .map((b) => ({ blockedId: b.blockedId, createdAt: b.createdAt }));
  }
}

class FakePostReader implements IModerationPostReader {
  constructor(private readonly authorId: string | null) {}
  async getAuthorId(): Promise<string | null> {
    return this.authorId;
  }
}

class FakeUserReader implements IModerationUserReader {
  constructor(private readonly users: ModerationUserSummary[]) {}
  async exists(userId: string): Promise<boolean> {
    return this.users.some((u) => u.id === userId);
  }
  async findSummariesByIds(ids: string[]): Promise<ModerationUserSummary[]> {
    return this.users.filter((u) => ids.includes(u.id));
  }
}

function makeBus(): { bus: IEventBus; received: string[] } {
  const received: string[] = [];
  const bus = new InMemoryEventBus(new InMemoryDeadLetterQueue(), {
    maxAttempts: 1,
    retryBaseDelayMs: 1,
  });
  for (const type of Object.values(MODERATION_EVENTS)) {
    bus.subscribe(type, {
      handlerName: `probe-${type}`,
      handle: (e) => {
        received.push(e.eventType);
      },
    });
  }
  return { bus, received };
}

const ctx = { userId: 'viewer', correlationId: 'corr-1' };
const target = { id: 'target', fullName: 'Target', handle: 'target', photoUrl: null };

describe('ReportPostUseCase', () => {
  it('reports a post and publishes PostReported', async () => {
    const reports = new InMemoryPostReportRepository();
    const { bus, received } = makeBus();
    const useCase = new ReportPostUseCase(reports, new FakePostReader('author'), bus);

    const result = await useCase.execute({ postId: 'post-1', reason: 'spam' }, ctx);

    expect(result.reported).toBe(true);
    expect(result.duplicate).toBe(false);
    expect(received).toContain(MODERATION_EVENTS.POST_REPORTED);
  });

  it('is idempotent when the same viewer reports again', async () => {
    const reports = new InMemoryPostReportRepository();
    const { bus } = makeBus();
    const useCase = new ReportPostUseCase(reports, new FakePostReader('author'), bus);

    const first = await useCase.execute({ postId: 'post-1', reason: 'spam' }, ctx);
    const second = await useCase.execute({ postId: 'post-1', reason: 'hate' }, ctx);

    expect(second.reportId).toBe(first.reportId);
    expect(second.duplicate).toBe(true);
  });

  it('rejects a missing post', async () => {
    const { bus } = makeBus();
    const useCase = new ReportPostUseCase(
      new InMemoryPostReportRepository(),
      new FakePostReader(null),
      bus,
    );
    await expect(
      useCase.execute({ postId: 'ghost', reason: 'spam' }, ctx),
    ).rejects.toThrow(NotFoundError);
  });

  it('rejects reporting your own post', async () => {
    const { bus } = makeBus();
    const useCase = new ReportPostUseCase(
      new InMemoryPostReportRepository(),
      new FakePostReader('viewer'),
      bus,
    );
    await expect(
      useCase.execute({ postId: 'mine', reason: 'spam' }, ctx),
    ).rejects.toThrow(ValidationError);
  });
});

describe('BlockUserUseCase', () => {
  it('blocks a user and publishes UserBlocked', async () => {
    const blocks = new InMemoryUserBlockRepository();
    const { bus, received } = makeBus();
    const useCase = new BlockUserUseCase(blocks, new FakeUserReader([target]), bus);

    const result = await useCase.execute(target.id, ctx);

    expect(result.blocked).toBe(true);
    expect(received).toContain(MODERATION_EVENTS.USER_BLOCKED);
    expect(await blocks.findByPair(ctx.userId, target.id)).not.toBeNull();
  });

  it('rejects blocking yourself', async () => {
    const { bus } = makeBus();
    const me = { id: 'viewer', fullName: 'Me', handle: 'me', photoUrl: null };
    const useCase = new BlockUserUseCase(
      new InMemoryUserBlockRepository(),
      new FakeUserReader([me]),
      bus,
    );
    await expect(useCase.execute('viewer', ctx)).rejects.toThrow(ValidationError);
  });

  it('rejects a missing user', async () => {
    const { bus } = makeBus();
    const useCase = new BlockUserUseCase(
      new InMemoryUserBlockRepository(),
      new FakeUserReader([]),
      bus,
    );
    await expect(useCase.execute('ghost', ctx)).rejects.toThrow(NotFoundError);
  });

  it('is idempotent when already blocked', async () => {
    const blocks = new InMemoryUserBlockRepository();
    const { bus, received } = makeBus();
    const useCase = new BlockUserUseCase(blocks, new FakeUserReader([target]), bus);
    await useCase.execute(target.id, ctx);
    received.length = 0;
    await useCase.execute(target.id, ctx);
    expect(received).toHaveLength(0);
  });
});

describe('UnblockUserUseCase', () => {
  it('unblocks and publishes UserUnblocked', async () => {
    const blocks = new InMemoryUserBlockRepository();
    const { bus, received } = makeBus();
    const block = new BlockUserUseCase(blocks, new FakeUserReader([target]), bus);
    const unblock = new UnblockUserUseCase(blocks, bus);

    await block.execute(target.id, ctx);
    received.length = 0;
    await unblock.execute(target.id, ctx);

    expect(received).toContain(MODERATION_EVENTS.USER_UNBLOCKED);
    expect(await blocks.findByPair(ctx.userId, target.id)).toBeNull();
  });
});

describe('ListBlockedUsersUseCase', () => {
  it('returns blocked user summaries', async () => {
    const blocks = new InMemoryUserBlockRepository();
    const { bus } = makeBus();
    const users = new FakeUserReader([target]);
    await new BlockUserUseCase(blocks, users, bus).execute(target.id, ctx);

    const list = new ListBlockedUsersUseCase(blocks, users);
    const result = await list.execute(ctx);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe(target.id);
    expect(result.items[0].handle).toBe('target');
  });
});
