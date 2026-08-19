import { ValidationError } from '../../../../shared/domain/result';

const DEFAULT_MAX_LENGTH = 4000;

export function sanitizeMessageContent(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim();
}

export class MessageContent {
  private constructor(readonly value: string) {}

  static create(raw: string, maxLength = DEFAULT_MAX_LENGTH): MessageContent {
    const sanitized = sanitizeMessageContent(raw);
    if (!sanitized) {
      throw new ValidationError('Message cannot be empty');
    }
    if (sanitized.length > maxLength) {
      throw new ValidationError(`Message exceeds maximum length of ${maxLength}`);
    }
    return new MessageContent(sanitized);
  }
}
