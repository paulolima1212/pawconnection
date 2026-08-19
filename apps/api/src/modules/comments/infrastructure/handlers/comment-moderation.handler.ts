import { Inject, Injectable, Logger } from '@nestjs/common';
import { IEventHandler } from '../../../../shared/events/event-bus';
import { CommentCreatedEvent } from '../../domain/events/comment-events';
import { CommentStatus } from '../../domain/comment-status';
import {
  COMMENT_REPOSITORY,
  ICommentRepository,
} from '../../domain/repositories/comment.repository';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';

/**
 * Asynchronous auto-moderation. Runs after a comment is created (reacting to the
 * event, never blocking the request). On a positive match it blocks the comment
 * by flipping its status to BLOCKED.
 *
 * The word list is intentionally tiny and illustrative — the real seam is to
 * replace `scan()` with an ML/AI classifier or external moderation API. Status
 * is updated directly (no new domain event) to avoid re-triggering moderation.
 */
@Injectable()
export class CommentModerationHandler implements IEventHandler<CommentCreatedEvent> {
  readonly handlerName = 'comment-moderation';
  private readonly logger = new Logger(CommentModerationHandler.name);

  private readonly bannedTerms = ['<<spam>>', '<<abuse>>'];

  constructor(
    @Inject(COMMENT_REPOSITORY) private readonly repo: ICommentRepository,
    private readonly prisma: PrismaService,
  ) {}

  async handle(event: CommentCreatedEvent): Promise<void> {
    const comment = await this.repo.findById(event.payload.commentId);
    if (!comment || comment.status !== CommentStatus.ACTIVE) return;

    if (!this.scan(comment.content)) return;

    await this.prisma.comment.update({
      where: { id: comment.id },
      data: { status: CommentStatus.BLOCKED },
    });
    this.logger.warn({
      msg: 'moderation.comment_blocked',
      commentId: comment.id,
      postId: comment.postId,
      correlationId: event.metadata.correlationId,
    });
  }

  private scan(content: string): boolean {
    const lower = content.toLowerCase();
    return this.bannedTerms.some((term) => lower.includes(term));
  }
}
