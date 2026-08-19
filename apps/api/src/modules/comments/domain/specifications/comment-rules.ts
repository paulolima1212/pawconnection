import { CompositeSpecification } from '../../../../shared/domain/specification';
import { CommentStatus, canReceiveReply } from '../comment-status';

/**
 * Maximum nesting depth for replies. Top-level comments have depth 0, so the
 * deepest allowed reply has depth = MAX_REPLY_DEPTH. Keeping this small bounds
 * the cost of ancestry walks and keeps the UI tree manageable.
 */
export const MAX_REPLY_DEPTH = 3;

/** A candidate parent comment evaluated when creating a reply. */
export interface ReplyTargetCandidate {
  status: CommentStatus;
  /** Depth of the parent comment (0 = top-level). */
  depth: number;
}

/** Parent must be in a status that accepts replies (not deleted/hidden/blocked). */
export class ParentAcceptsReplySpec extends CompositeSpecification<ReplyTargetCandidate> {
  isSatisfiedBy(candidate: ReplyTargetCandidate): boolean {
    return canReceiveReply(candidate.status);
  }
}

/** Resulting reply depth (parent.depth + 1) must not exceed the limit. */
export class WithinMaxDepthSpec extends CompositeSpecification<ReplyTargetCandidate> {
  isSatisfiedBy(candidate: ReplyTargetCandidate): boolean {
    return candidate.depth + 1 <= MAX_REPLY_DEPTH;
  }
}

/** Combined precondition for replying to a comment. */
export const canReplyToSpec = new ParentAcceptsReplySpec().and(
  new WithinMaxDepthSpec(),
);
