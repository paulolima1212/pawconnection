import { Comment } from './comment.entity';
import { CommentStatus } from './comment-status';
import { CommentContent } from './value-objects/comment-content.vo';
import { COMMENT_EVENTS } from './events/comment-events';

const content = (s: string) => CommentContent.create(s);

describe('Comment aggregate', () => {
  describe('createTopLevel', () => {
    it('creates an ACTIVE comment and records CommentCreated', () => {
      const comment = Comment.createTopLevel({
        postId: 'post-1',
        authorId: 'user-1',
        content: content('Hello world'),
      });

      expect(comment.status).toBe(CommentStatus.ACTIVE);
      expect(comment.isReply).toBe(false);
      expect(comment.parentCommentId).toBeNull();

      const events = comment.pullEvents();
      expect(events.map((e) => e.eventType)).toEqual([COMMENT_EVENTS.CREATED]);
      expect(events[0].aggregateId).toBe(comment.id);
    });
  });

  describe('createReply', () => {
    it('records both CommentCreated and ReplyCreated with depth', () => {
      const reply = Comment.createReply({
        postId: 'post-1',
        authorId: 'user-2',
        content: content('Nice!'),
        parent: { parentCommentId: 'c-1', parentAuthorId: 'user-1', parentDepth: 0 },
      });

      expect(reply.isReply).toBe(true);
      expect(reply.parentCommentId).toBe('c-1');

      const events = reply.pullEvents();
      expect(events.map((e) => e.eventType)).toEqual([
        COMMENT_EVENTS.CREATED,
        COMMENT_EVENTS.REPLY_CREATED,
      ]);
      const replyEvent = events[1].payload as { depth: number; parentAuthorId: string };
      expect(replyEvent.depth).toBe(1);
      expect(replyEvent.parentAuthorId).toBe('user-1');
    });
  });

  describe('edit', () => {
    it('allows the author to edit and marks it EDITED', () => {
      const comment = Comment.createTopLevel({
        postId: 'p',
        authorId: 'author',
        content: content('original'),
      });
      comment.pullEvents();

      comment.edit(content('updated'), 'author');

      expect(comment.content).toBe('updated');
      expect(comment.status).toBe(CommentStatus.EDITED);
      expect(comment.pullEvents().map((e) => e.eventType)).toEqual([
        COMMENT_EVENTS.EDITED,
      ]);
    });

    it('rejects edits from a non-author', () => {
      const comment = Comment.createTopLevel({
        postId: 'p',
        authorId: 'author',
        content: content('original'),
      });
      expect(() => comment.edit(content('hax'), 'someone-else')).toThrow(
        /only the author/i,
      );
    });

    it('rejects editing a deleted comment', () => {
      const comment = Comment.createTopLevel({
        postId: 'p',
        authorId: 'author',
        content: content('original'),
      });
      comment.softDelete('author', { byModerator: false });
      expect(() => comment.edit(content('back'), 'author')).toThrow(/deleted/i);
    });

    it('is a no-op when content is unchanged', () => {
      const comment = Comment.createTopLevel({
        postId: 'p',
        authorId: 'author',
        content: content('same'),
      });
      comment.pullEvents();
      comment.edit(content('same'), 'author');
      expect(comment.pullEvents()).toHaveLength(0);
      expect(comment.status).toBe(CommentStatus.ACTIVE);
    });
  });

  describe('softDelete', () => {
    it('lets the author soft-delete and records CommentDeleted', () => {
      const comment = Comment.createTopLevel({
        postId: 'p',
        authorId: 'author',
        content: content('bye'),
      });
      comment.pullEvents();

      comment.softDelete('author', { byModerator: false });

      expect(comment.status).toBe(CommentStatus.DELETED);
      expect(comment.deletedAt).toBeInstanceOf(Date);
      const events = comment.pullEvents();
      expect(events.map((e) => e.eventType)).toEqual([COMMENT_EVENTS.DELETED]);
      expect((events[0].payload as { previousStatus: string }).previousStatus).toBe(
        CommentStatus.ACTIVE,
      );
    });

    it('lets a moderator delete a comment they did not author', () => {
      const comment = Comment.createTopLevel({
        postId: 'p',
        authorId: 'author',
        content: content('spam'),
      });
      comment.pullEvents();
      comment.softDelete('mod', { byModerator: true });
      expect(comment.status).toBe(CommentStatus.DELETED);
    });

    it('rejects deletion by an unrelated, non-moderator user', () => {
      const comment = Comment.createTopLevel({
        postId: 'p',
        authorId: 'author',
        content: content('keep'),
      });
      expect(() => comment.softDelete('intruder', { byModerator: false })).toThrow(
        /permission/i,
      );
    });

    it('is idempotent when already deleted', () => {
      const comment = Comment.createTopLevel({
        postId: 'p',
        authorId: 'author',
        content: content('bye'),
      });
      comment.softDelete('author', { byModerator: false });
      comment.pullEvents();
      comment.softDelete('author', { byModerator: false });
      expect(comment.pullEvents()).toHaveLength(0);
    });
  });
});
