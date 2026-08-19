import { ValidationError } from '../../../../shared/domain/result';

/**
 * Value Object for comment text. Immutable and self-validating: a CommentContent
 * can only exist if it satisfies all domain rules. Construction also sanitizes
 * the input to neutralize stored-XSS vectors before the value ever reaches the
 * database or other clients.
 */
export class CommentContent {
  static readonly MIN_LENGTH = 1;
  static readonly MAX_LENGTH = 2000;

  private constructor(private readonly _value: string) {}

  get value(): string {
    return this._value;
  }

  static create(raw: string): CommentContent {
    if (typeof raw !== 'string') {
      throw new ValidationError('Comment content is required');
    }

    const sanitized = CommentContent.sanitize(raw);

    if (sanitized.length < CommentContent.MIN_LENGTH) {
      throw new ValidationError('Comment cannot be empty');
    }
    if (sanitized.length > CommentContent.MAX_LENGTH) {
      throw new ValidationError(
        `Comment cannot exceed ${CommentContent.MAX_LENGTH} characters`,
      );
    }
    return new CommentContent(sanitized);
  }

  /**
   * Defense-in-depth sanitization:
   * - strips HTML tags (prevents stored XSS / markup injection),
   * - removes control characters,
   * - collapses excessive whitespace and trims.
   *
   * Output is treated as plain text by clients; rendering layers should still
   * escape on display, but persisting clean text avoids trusting the client.
   */
  static sanitize(raw: string): string {
    return raw
      .replace(/<[^>]*>/g, '') // drop HTML tags
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // control chars
      .replace(/[ \t]{2,}/g, ' ') // collapse runs of spaces/tabs
      .replace(/\n{3,}/g, '\n\n') // cap consecutive blank lines
      .trim();
  }

  equals(other: CommentContent): boolean {
    return other instanceof CommentContent && other._value === this._value;
  }
}
