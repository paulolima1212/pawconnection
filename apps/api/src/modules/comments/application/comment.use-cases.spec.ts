import { InMemoryDeadLetterQueue } from '../../../shared/events/dead-letter-queue';
import { InMemoryEventBus } from '../../../shared/events/in-memory-event-bus';
import { IEventBus } from '../../../shared/events/event-bus';
import { Comment } from '../domain/comment.entity';
import { CommentStatus } from '../domain/comment-status';
import { COMMENT_EVENTS } from '../domain/events/comment-events';
import {
  CommentOrder,
  CommentPage,
  CommentReadModel,
  ICommentRepository,
  ListCommentsOptions,
} from '../domain/repositories/comment.repository';
import { IPostReader } from '../domain/ports/post-reader.port';
import { IModerationPolicy } from '../domain/ports/moderation-policy.port';
import {
  CreateCommentUseCase,
  DeleteCommentUseCase,
  EditCommentUseCase,
  ListPostCommentsUseCase,
  ReplyToCommentUseCase,
} from './comment.use-cases';

/** Minimal in-memory repository used to integrate the application + event flow. */
class InMemoryCommentRepository implements ICommentRepository {
  private readonly rows = new Map<string, Comment>();

  private toReadModel(c: Comment): CommentReadModel {
    const s = c.toState();
    return {
      ...s,
      author: { id: s.authorId, fullName: 'User', handle: 'user' },
      replyCount: [...this.rows.values()].filter(
        (r) => r.parentCommentId === s.id,
      ).length,
    };
  }

  async findById(id: string): Promise<Comment | null> {
    const c = this.rows.get(id);
    return c ? Comment.restore(c.toState()) : null;
  }
  async findReadModelById(id: string): Promise<CommentReadModel | null> {
    const c = this.rows.get(id);
    return c ? this.toReadModel(c) : null;
  }
  async create(comment: Comment): Promise<void> {
    this.rows.set(comment.id, Comment.restore(comment.toState()));
  }
  async update(comment: Comment): Promise<void> {
    this.rows.set(comment.id, Comment.restore(comment.toState()));
  }
  async getDepth(commentId: string): Promise<number | null> {
    let depth = 0;
    let current = this.rows.get(commentId);
    if (!current) return null;
    while (current && current.parentCommentId) {
      depth += 1;
      current = this.rows.get(current.parentCommentId);
    }
    return depth;
  }
  private page(filter: (c: Comment) => boolean, options: ListCommentsOptions): CommentPage {
    const all = [...this.rows.values()]
      .filter(filter)
      .filter((c) => c.status !== CommentStatus.HIDDEN && c.status !== CommentStatus.BLOCKED)
      .sort((a, b) =>
        options.order === 'newest'
          ? b.createdAt.getTime() - a.createdAt.getTime()
          : a.createdAt.getTime() - b.createdAt.getTime(),
      );
    return { items: all.slice(0, options.limit).map((c) => this.toReadModel(c)), nextCursor: null };
  }
  async listTopLevel(postId: string, options: ListCommentsOptions): Promise<CommentPage> {
    return this.page((c) => c.postId === postId && c.parentCommentId === null, options);
  }
  async listReplies(parentId: string, options: ListCommentsOptions): Promise<CommentPage> {
    return this.page((c) => c.parentCommentId === parentId, options);
  }
  async previewRepliesFor(
    parentIds: string[],
    perParent: number,
    order: CommentOrder,
  ): Promise<Map<string, CommentReadModel[]>> {
    const map = new Map<string, CommentReadModel[]>();
    for (const id of parentIds) {
      const { items } = this.page((c) => c.parentCommentId === id, {
        limit: perParent,
        order,
      });
      map.set(id, items);
    }
    return map;
  }
  async countByPost(postId: string): Promise<number> {
    return [...this.rows.values()].filter(
      (c) =>
        c.postId === postId &&
        (c.status === CommentStatus.ACTIVE || c.status === CommentStatus.EDITED),
    ).length;
  }
}

class FakePostReader implements IPostReader {
  constructor(private readonly authorId: string | null) {}
  async exists(): Promise<boolean> {
    return this.authorId !== null;
  }
  async getAuthorId(): Promise<string | null> {
    return this.authorId;
  }
}

class AllowAllBlocks {
  async isBlockedBetween(): Promise<boolean> {
    return false;
  }
  async isBlockedBy(): Promise<boolean> {
    return false;
  }
  async listHiddenUserIds(): Promise<string[]> {
    return [];
  }
  async listBlockedByMe(): Promise<string[]> {
    return [];
  }
  async listWhoBlocked(): Promise<string[]> {
    return [];
  }
}

class NoModerators implements IModerationPolicy {
  async isModerator(): Promise<boolean> {
    return false;
  }
}

function makeBus(): { bus: IEventBus; received: string[] } {
  const received: string[] = [];
  const bus = new InMemoryEventBus(new InMemoryDeadLetterQueue(), {
    maxAttempts: 1,
    retryBaseDelayMs: 1,
  });
  for (const type of Object.values(COMMENT_EVENTS)) {
    bus.subscribe(type, {
      handlerName: `probe-${type}`,
      handle: (e) => {
        received.push(e.eventType);
      },
    });
  }
  return { bus, received };
}

describe('Comment use cases (application + events integration)', () => {
  const ctx = { userId: 'user-1', correlationId: 'corr-1' };

  it('creates a comment and publishes CommentCreated', async () => {
    const repo = new InMemoryCommentRepository();
    const { bus, received } = makeBus();
    const useCase = new CreateCommentUseCase(
      repo,
      new FakePostReader('post-author'),
      bus,
      new AllowAllBlocks(),
    );

    const res = await useCase.execute({ postId: 'post-1', content: 'Hello' }, ctx);

    expect(res.content).toBe('Hello');
    expect(res.status).toBe(CommentStatus.ACTIVE);
    expect(received).toContain(COMMENT_EVENTS.CREATED);
    expect(await repo.countByPost('post-1')).toBe(1);
  });

  it('rejects commenting when the viewer is blocked from the author', async () => {
    const repo = new InMemoryCommentRepository();
    const { bus } = makeBus();
    const blocked = {
      async isBlockedBetween(): Promise<boolean> {
        return true;
      },
      async isBlockedBy(): Promise<boolean> {
        return true;
      },
      async listHiddenUserIds(): Promise<string[]> {
        return ['post-author'];
      },
      async listBlockedByMe(): Promise<string[]> {
        return ['post-author'];
      },
      async listWhoBlocked(): Promise<string[]> {
        return [];
      },
    };
    const useCase = new CreateCommentUseCase(
      repo,
      new FakePostReader('post-author'),
      bus,
      blocked,
    );

    await expect(
      useCase.execute({ postId: 'post-1', content: 'Hello' }, ctx),
    ).rejects.toThrow(/cannot interact/i);
  });

  it('rejects commenting on a non-existent post', async () => {
    const repo = new InMemoryCommentRepository();
    const { bus } = makeBus();
    const useCase = new CreateCommentUseCase(repo, new FakePostReader(null), bus, new AllowAllBlocks());

    await expect(
      useCase.execute({ postId: 'ghost', content: 'hi' }, ctx),
    ).rejects.toThrow(/post not found/i);
  });

  it('creates a reply and publishes both CommentCreated and ReplyCreated', async () => {
    const repo = new InMemoryCommentRepository();
    const { bus, received } = makeBus();
    const create = new CreateCommentUseCase(repo, new FakePostReader('pa'), bus, new AllowAllBlocks());
    const reply = new ReplyToCommentUseCase(repo, bus, new FakePostReader('pa'), new AllowAllBlocks());

    const parent = await create.execute({ postId: 'p1', content: 'parent' }, ctx);
    received.length = 0;

    const child = await reply.execute(
      { parentCommentId: parent.id, content: 'child' },
      { userId: 'user-2', correlationId: 'corr-2' },
    );

    expect(child.parentCommentId).toBe(parent.id);
    expect(received).toEqual(
      expect.arrayContaining([COMMENT_EVENTS.CREATED, COMMENT_EVENTS.REPLY_CREATED]),
    );
  });

  it('enforces max reply depth', async () => {
    const repo = new InMemoryCommentRepository();
    const { bus } = makeBus();
    const create = new CreateCommentUseCase(repo, new FakePostReader('pa'), bus, new AllowAllBlocks());
    const reply = new ReplyToCommentUseCase(repo, bus, new FakePostReader('pa'), new AllowAllBlocks());

    let current = await create.execute({ postId: 'p1', content: 'root' }, ctx);
    // depth 1, 2, 3 are allowed; the 4th should fail (MAX_REPLY_DEPTH = 3)
    for (let i = 0; i < 3; i += 1) {
      current = await reply.execute(
        { parentCommentId: current.id, content: `level ${i + 1}` },
        ctx,
      );
    }
    await expect(
      reply.execute({ parentCommentId: current.id, content: 'too deep' }, ctx),
    ).rejects.toThrow(/maximum nesting depth|cannot reply/i);
  });

  it('blocks replies to a deleted comment', async () => {
    const repo = new InMemoryCommentRepository();
    const { bus } = makeBus();
    const create = new CreateCommentUseCase(repo, new FakePostReader('pa'), bus, new AllowAllBlocks());
    const del = new DeleteCommentUseCase(repo, new NoModerators(), bus);
    const reply = new ReplyToCommentUseCase(repo, bus, new FakePostReader('pa'), new AllowAllBlocks());

    const parent = await create.execute({ postId: 'p1', content: 'parent' }, ctx);
    await del.execute({ commentId: parent.id }, ctx);

    await expect(
      reply.execute({ parentCommentId: parent.id, content: 'orphan' }, ctx),
    ).rejects.toThrow(/cannot reply/i);
  });

  it('only the author can edit', async () => {
    const repo = new InMemoryCommentRepository();
    const { bus } = makeBus();
    const create = new CreateCommentUseCase(repo, new FakePostReader('pa'), bus, new AllowAllBlocks());
    const edit = new EditCommentUseCase(repo, bus);

    const c = await create.execute({ postId: 'p1', content: 'mine' }, ctx);

    await expect(
      edit.execute(
        { commentId: c.id, content: 'hacked' },
        { userId: 'intruder' },
      ),
    ).rejects.toThrow(/only the author/i);

    const edited = await edit.execute({ commentId: c.id, content: 'updated' }, ctx);
    expect(edited.edited).toBe(true);
    expect(edited.content).toBe('updated');
  });

  it('soft-deletes and keeps the thread, returning a tombstone in listing', async () => {
    const repo = new InMemoryCommentRepository();
    const { bus } = makeBus();
    const create = new CreateCommentUseCase(repo, new FakePostReader('pa'), bus, new AllowAllBlocks());
    const reply = new ReplyToCommentUseCase(repo, bus, new FakePostReader('pa'), new AllowAllBlocks());
    const del = new DeleteCommentUseCase(repo, new NoModerators(), bus);
    const list = new ListPostCommentsUseCase(repo, new AllowAllBlocks());

    const parent = await create.execute({ postId: 'p1', content: 'parent' }, ctx);
    await reply.execute({ parentCommentId: parent.id, content: 'child' }, ctx);
    await del.execute({ commentId: parent.id }, ctx);

    const page = await list.execute({ postId: 'p1' });
    const tombstone = page.items.find((c) => c.id === parent.id);
    expect(tombstone?.deleted).toBe(true);
    expect(tombstone?.content).toBe('[deleted]');
    expect(tombstone?.replies).toHaveLength(1); // reply preserved
    expect(await repo.countByPost('p1')).toBe(1); // only the reply counts now
  });
});
