import { Inject, Injectable, Logger } from '@nestjs/common';
import { IEventHandler } from '../../../../shared/events/event-bus';
import {
  CommentCreatedEvent,
  ReplyCreatedEvent,
} from '../../domain/events/comment-events';
import { IPostReader, POST_READER } from '../../domain/ports/post-reader.port';

/**
 * Emits notification intents:
 * - new top-level comment  -> notify the post author
 * - new reply              -> notify the parent comment's author
 *
 * Currently logs the intent (a real push/email/websocket transport plugs in
 * here later). Self-notifications are skipped.
 */
@Injectable()
export class CommentNotificationHandler
  implements IEventHandler<CommentCreatedEvent | ReplyCreatedEvent>
{
  readonly handlerName = 'comment-notification';
  private readonly logger = new Logger(CommentNotificationHandler.name);

  constructor(@Inject(POST_READER) private readonly posts: IPostReader) {}

  async handle(event: CommentCreatedEvent | ReplyCreatedEvent): Promise<void> {
    if (event.eventType === 'comment.reply_created') {
      const p = (event as ReplyCreatedEvent).payload;
      if (p.parentAuthorId && p.parentAuthorId !== p.authorId) {
        this.notify(p.parentAuthorId, 'reply', event.metadata.correlationId, {
          commentId: p.commentId,
          postId: p.postId,
        });
      }
      return;
    }

    const p = (event as CommentCreatedEvent).payload;
    if (p.parentCommentId) return; // replies handled above

    const postAuthorId = await this.posts.getAuthorId(p.postId);
    if (postAuthorId && postAuthorId !== p.authorId) {
      this.notify(postAuthorId, 'comment', event.metadata.correlationId, {
        commentId: p.commentId,
        postId: p.postId,
      });
    }
  }

  private notify(
    recipientId: string,
    kind: 'comment' | 'reply',
    correlationId: string | undefined,
    ctx: Record<string, string>,
  ): void {
    this.logger.log({
      msg: 'notification.dispatch',
      kind,
      recipientId,
      correlationId,
      ...ctx,
    });
  }
}
