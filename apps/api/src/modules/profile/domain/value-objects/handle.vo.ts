import { ValidationError } from '../../../../shared/domain/result';

export const HANDLE_MIN_LENGTH = 3;
export const HANDLE_MAX_LENGTH = 20;
export const HANDLE_PATTERN = /^[a-z0-9_]+$/;

export class Handle {
  private constructor(readonly value: string) {}

  static parse(raw: string): Handle {
    const normalized = (raw ?? '').replace(/^@+/, '').trim().toLowerCase();
    if (!normalized) {
      throw new ValidationError('Handle is required');
    }
    if (normalized.length < HANDLE_MIN_LENGTH || normalized.length > HANDLE_MAX_LENGTH) {
      throw new ValidationError(
        `Handle must be ${HANDLE_MIN_LENGTH}–${HANDLE_MAX_LENGTH} characters`,
      );
    }
    if (!HANDLE_PATTERN.test(normalized)) {
      throw new ValidationError('Handle may only contain letters, numbers, and underscores');
    }
    return new Handle(normalized);
  }

  /** Normalize a persisted or lookup value; returns null when invalid. */
  static tryNormalize(raw: string): string | null {
    try {
      return Handle.parse(raw).value;
    } catch {
      return null;
    }
  }

  static fromString(value: string): Handle {
    return Handle.parse(value);
  }
}
