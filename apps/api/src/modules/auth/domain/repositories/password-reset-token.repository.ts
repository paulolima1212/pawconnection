export const PASSWORD_RESET_TOKEN_REPOSITORY = Symbol(
  'PASSWORD_RESET_TOKEN_REPOSITORY',
);

export interface PasswordResetTokenRecord {
  id: string;
  userId: string;
  expiresAt: Date;
}

export interface IPasswordResetTokenRepository {
  deleteByUserId(userId: string): Promise<void>;
  create(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;
  findValidByTokenHash(
    tokenHash: string,
  ): Promise<PasswordResetTokenRecord | null>;
  markUsed(id: string): Promise<void>;
}
