/**
 * Lifecycle status of a comment. Mirrors the `CommentStatus` Prisma enum.
 *
 * - ACTIVE  : normal, visible comment
 * - EDITED  : edited by its author, still visible
 * - DELETED : soft-deleted; row kept so replies survive, content hidden
 * - HIDDEN  : hidden by moderation (recoverable)
 * - BLOCKED : blocked by moderation / automated filter (terminal)
 */
export enum CommentStatus {
  ACTIVE = 'ACTIVE',
  EDITED = 'EDITED',
  DELETED = 'DELETED',
  HIDDEN = 'HIDDEN',
  BLOCKED = 'BLOCKED',
}

/** Statuses where the comment is publicly visible with its real content. */
export const VISIBLE_STATUSES: readonly CommentStatus[] = [
  CommentStatus.ACTIVE,
  CommentStatus.EDITED,
];

/** Statuses that may still receive replies. */
export const REPLYABLE_STATUSES: readonly CommentStatus[] = [
  CommentStatus.ACTIVE,
  CommentStatus.EDITED,
];

export function isVisible(status: CommentStatus): boolean {
  return VISIBLE_STATUSES.includes(status);
}

export function canReceiveReply(status: CommentStatus): boolean {
  return REPLYABLE_STATUSES.includes(status);
}
