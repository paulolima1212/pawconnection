import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotFoundError, ValidationError } from '../../../shared/domain/result';
import { EVENT_BUS, IEventBus } from '../../../shared/events/event-bus';
import { EventMetadata } from '../../../shared/events/domain-event';
import { Comment } from '../domain/comment.entity';
import { CommentContent } from '../domain/value-objects/comment-content.vo';
import { canReplyToSpec } from '../domain/specifications/comment-rules';
import {
  COMMENT_REPOSITORY,
  CommentOrder,
  ICommentRepository,
} from '../domain/repositories/comment.repository';
import { IPostReader, POST_READER } from '../domain/ports/post-reader.port';
import {
  IModerationPolicy,
  MODERATION_POLICY,
} from '../domain/ports/moderation-policy.port';
import {
  CommentResponse,
  CommentTree,
  toCommentResponse,
  toCommentTree,
} from './comment.mapper';

/** Ambient request context propagated into events and structured logs. */
export interface RequestContext {
  userId: string;
  correlationId?: string;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const REPLIES_PREVIEW = 3;

function metaOf(ctx: RequestContext): EventMetadata {
  return { correlationId: ctx.correlationId, userId: ctx.userId, source: 'comments' };
}

function clampLimit(limit?: number): number {
  if (!limit || Number.isNaN(limit) || limit < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(limit, MAX_PAGE_SIZE);
}

/** Pulls the aggregate's events and publishes them through the bus. */
async function flush(bus: IEventBus, comment: Comment): Promise<void> {
  const events = comment.pullEvents();
  if (events.length) await bus.publishAll(events);
}

@Injectable()
export class CreateCommentUseCase {
  private readonly logger = new Logger(CreateCommentUseCase.name);

  constructor(
    @Inject(COMMENT_REPOSITORY) private readonly repo: ICommentRepository,
    @Inject(POST_READER) private readonly posts: IPostReader,
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
  ) {}

  async execute(
    input: { postId: string; content: string },
    ctx: RequestContext,
  ): Promise<CommentResponse> {
    if (!(await this.posts.exists(input.postId))) {
      throw new NotFoundError('Post not found');
    }

    const comment = Comment.createTopLevel({
      postId: input.postId,
      authorId: ctx.userId,
      content: CommentContent.create(input.content),
      metadata: metaOf(ctx),
    });

    await this.repo.create(comment);
    await flush(this.bus, comment);

    this.logger.log({
      msg: 'comment.created',
      commentId: comment.id,
      postId: comment.postId,
      authorId: ctx.userId,
      correlationId: ctx.correlationId,
    });

    return this.loadResponse(comment.id);
  }

  private async loadResponse(id: string): Promise<CommentResponse> {
    const model = await this.repo.findReadModelById(id);
    if (!model) throw new NotFoundError('Comment not found');
    return toCommentResponse(model);
  }
}

@Injectable()
export class ReplyToCommentUseCase {
  private readonly logger = new Logger(ReplyToCommentUseCase.name);

  constructor(
    @Inject(COMMENT_REPOSITORY) private readonly repo: ICommentRepository,
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
  ) {}

  async execute(
    input: { parentCommentId: string; content: string },
    ctx: RequestContext,
  ): Promise<CommentResponse> {
    const parent = await this.repo.findById(input.parentCommentId);
    if (!parent) throw new NotFoundError('Parent comment not found');

    const parentDepth = (await this.repo.getDepth(parent.id)) ?? 0;

    if (!canReplyToSpec.isSatisfiedBy({ status: parent.status, depth: parentDepth })) {
      throw new ValidationError(
        'Cannot reply to this comment (it may be unavailable or the maximum nesting depth was reached)',
      );
    }

    const reply = Comment.createReply({
      postId: parent.postId,
      authorId: ctx.userId,
      content: CommentContent.create(input.content),
      parent: {
        parentCommentId: parent.id,
        parentAuthorId: parent.authorId,
        parentDepth,
      },
      metadata: metaOf(ctx),
    });

    await this.repo.create(reply);
    await flush(this.bus, reply);

    this.logger.log({
      msg: 'comment.reply_created',
      commentId: reply.id,
      parentCommentId: parent.id,
      postId: reply.postId,
      authorId: ctx.userId,
      correlationId: ctx.correlationId,
    });

    const model = await this.repo.findReadModelById(reply.id);
    if (!model) throw new NotFoundError('Comment not found');
    return toCommentResponse(model);
  }
}

@Injectable()
export class EditCommentUseCase {
  private readonly logger = new Logger(EditCommentUseCase.name);

  constructor(
    @Inject(COMMENT_REPOSITORY) private readonly repo: ICommentRepository,
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
  ) {}

  async execute(
    input: { commentId: string; content: string },
    ctx: RequestContext,
  ): Promise<CommentResponse> {
    const comment = await this.repo.findById(input.commentId);
    if (!comment) throw new NotFoundError('Comment not found');

    comment.edit(CommentContent.create(input.content), ctx.userId, metaOf(ctx));

    await this.repo.update(comment);
    await flush(this.bus, comment);

    this.logger.log({
      msg: 'comment.edited',
      commentId: comment.id,
      authorId: ctx.userId,
      correlationId: ctx.correlationId,
    });

    const model = await this.repo.findReadModelById(comment.id);
    if (!model) throw new NotFoundError('Comment not found');
    return toCommentResponse(model);
  }
}

@Injectable()
export class DeleteCommentUseCase {
  private readonly logger = new Logger(DeleteCommentUseCase.name);

  constructor(
    @Inject(COMMENT_REPOSITORY) private readonly repo: ICommentRepository,
    @Inject(MODERATION_POLICY) private readonly moderation: IModerationPolicy,
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
  ) {}

  async execute(
    input: { commentId: string },
    ctx: RequestContext,
  ): Promise<{ id: string; status: string }> {
    const comment = await this.repo.findById(input.commentId);
    if (!comment) throw new NotFoundError('Comment not found');

    const byModerator = await this.moderation.isModerator(ctx.userId);
    comment.softDelete(ctx.userId, { byModerator }, metaOf(ctx));

    await this.repo.update(comment);
    await flush(this.bus, comment);

    this.logger.log({
      msg: 'comment.deleted',
      commentId: comment.id,
      actorId: ctx.userId,
      byModerator,
      correlationId: ctx.correlationId,
    });

    return { id: comment.id, status: comment.status };
  }
}

@Injectable()
export class ListPostCommentsUseCase {
  constructor(
    @Inject(COMMENT_REPOSITORY) private readonly repo: ICommentRepository,
  ) {}

  async execute(input: {
    postId: string;
    limit?: number;
    cursor?: string | null;
    order?: CommentOrder;
  }): Promise<{ items: CommentTree[]; nextCursor: string | null }> {
    const order: CommentOrder = input.order ?? 'newest';
    const page = await this.repo.listTopLevel(input.postId, {
      limit: clampLimit(input.limit),
      cursor: input.cursor,
      order,
    });

    const parentIds = page.items.map((c) => c.id);
    const repliesByParent = await this.repo.previewRepliesFor(
      parentIds,
      REPLIES_PREVIEW,
      'oldest',
    );

    const items = page.items.map((c) =>
      toCommentTree(c, repliesByParent.get(c.id) ?? []),
    );
    return { items, nextCursor: page.nextCursor };
  }
}

@Injectable()
export class ListCommentRepliesUseCase {
  constructor(
    @Inject(COMMENT_REPOSITORY) private readonly repo: ICommentRepository,
  ) {}

  async execute(input: {
    commentId: string;
    limit?: number;
    cursor?: string | null;
    order?: CommentOrder;
  }): Promise<{ items: CommentResponse[]; nextCursor: string | null }> {
    const page = await this.repo.listReplies(input.commentId, {
      limit: clampLimit(input.limit),
      cursor: input.cursor,
      order: input.order ?? 'oldest',
    });
    return { items: page.items.map(toCommentResponse), nextCursor: page.nextCursor };
  }
}

@Injectable()
export class CountPostCommentsUseCase {
  constructor(
    @Inject(COMMENT_REPOSITORY) private readonly repo: ICommentRepository,
  ) {}

  async execute(postId: string): Promise<{ postId: string; count: number }> {
    const count = await this.repo.countByPost(postId);
    return { postId, count };
  }
}
