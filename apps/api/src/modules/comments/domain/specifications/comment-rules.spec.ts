import { CommentStatus } from '../comment-status';
import {
  canReplyToSpec,
  MAX_REPLY_DEPTH,
  ParentAcceptsReplySpec,
  WithinMaxDepthSpec,
} from './comment-rules';

describe('comment reply rules', () => {
  describe('ParentAcceptsReplySpec', () => {
    const spec = new ParentAcceptsReplySpec();
    it('allows replies to active/edited comments', () => {
      expect(spec.isSatisfiedBy({ status: CommentStatus.ACTIVE, depth: 0 })).toBe(true);
      expect(spec.isSatisfiedBy({ status: CommentStatus.EDITED, depth: 0 })).toBe(true);
    });
    it('blocks replies to deleted/hidden/blocked comments', () => {
      for (const status of [
        CommentStatus.DELETED,
        CommentStatus.HIDDEN,
        CommentStatus.BLOCKED,
      ]) {
        expect(spec.isSatisfiedBy({ status, depth: 0 })).toBe(false);
      }
    });
  });

  describe('WithinMaxDepthSpec', () => {
    const spec = new WithinMaxDepthSpec();
    it('allows depth up to the limit', () => {
      expect(spec.isSatisfiedBy({ status: CommentStatus.ACTIVE, depth: MAX_REPLY_DEPTH - 1 })).toBe(
        true,
      );
    });
    it('rejects when the resulting depth would exceed the limit', () => {
      expect(
        spec.isSatisfiedBy({ status: CommentStatus.ACTIVE, depth: MAX_REPLY_DEPTH }),
      ).toBe(false);
    });
  });

  describe('canReplyToSpec (composite)', () => {
    it('requires both an acceptable status and an in-bounds depth', () => {
      expect(canReplyToSpec.isSatisfiedBy({ status: CommentStatus.ACTIVE, depth: 0 })).toBe(
        true,
      );
      expect(
        canReplyToSpec.isSatisfiedBy({ status: CommentStatus.DELETED, depth: 0 }),
      ).toBe(false);
      expect(
        canReplyToSpec.isSatisfiedBy({
          status: CommentStatus.ACTIVE,
          depth: MAX_REPLY_DEPTH,
        }),
      ).toBe(false);
    });
  });
});
