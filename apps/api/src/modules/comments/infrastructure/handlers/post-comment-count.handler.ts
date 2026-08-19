import { Inject, Injectable, Logger } from '@nestjs/common';
import { IEventHandler } from '../../../../shared/events/event-bus';
import {
  CommentCreatedEvent,
  CommentDeletedEvent,
} from '../../domain/events/comment-events';
import {
  COMMENT_REPOSITORY,
  ICommentRepository,
} from '../../domain/repositories/comment.repository';

/**
 * Keeps the post's comment count fresh. The count is recomputed from the source
 * of truth on each create/delete (cheap, indexed COUNT) and emitted as a
 * structured log; a denormalized counter column or cache can later subscribe to
 * the same events without changing producers.
 */
@Injectable()
export class PostCommentCountHandler
  implements IEventHandler<CommentCreatedEvent | CommentDeletedEvent>
{
  readonly handlerName = 'post-comment-count';
  private readonly logger = new Logger(PostCommentCountHandler.name);

  constructor(
    @Inject(COMMENT_REPOSITORY) private readonly repo: ICommentRepository,
  ) {}

  async handle(event: CommentCreatedEvent | CommentDeletedEvent): Promise<void> {
    const postId = event.payload.postId;
    const count = await this.repo.countByPost(postId);
    this.logger.log({
      msg: 'post.comment_count.updated',
      postId,
      count,
      trigger: event.eventType,
      correlationId: event.metadata.correlationId,
    });
  }
}
