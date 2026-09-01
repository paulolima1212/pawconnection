import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { ValidationError } from '../../../shared/domain/result';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../profile/domain/repositories/user.repository';
import {
  EMAIL_SENDER,
  IEmailSender,
} from '../domain/ports/email-sender.port';
import {
  createPasswordResetToken,
  hashPasswordResetToken,
} from '../domain/password-reset-token.util';
import {
  IPasswordResetTokenRepository,
  PASSWORD_RESET_TOKEN_REPOSITORY,
} from '../domain/repositories/password-reset-token.repository';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly resetTokens: IPasswordResetTokenRepository,
    @Inject(EMAIL_SENDER) private readonly email: IEmailSender,
    private readonly config: ConfigService,
  ) {}

  async execute(input: { email: string }) {
    const email = input.email.trim().toLowerCase();
    const user = await this.users.findByEmail(email);

    if (user?.passwordHash) {
      const { raw, hash } = createPasswordResetToken();
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

      await this.resetTokens.deleteByUserId(user.id);
      await this.resetTokens.create({
        userId: user.id,
        tokenHash: hash,
        expiresAt,
      });

      const appUrl = this.config.get<string>('APP_URL', 'http://localhost:8081');
      const resetUrl = `${appUrl.replace(/\/$/, '')}/reset-password?token=${raw}`;

      await this.email.send({
        to: email,
        subject: 'Reset your Paw Connection password',
        text: [
          'Hi,',
          '',
          'We received a request to reset your Paw Connection password.',
          'Open this link to choose a new password:',
          resetUrl,
          '',
          'This link expires in 1 hour. If you did not request a reset, you can ignore this email.',
        ].join('\n'),
        html: [
          '<p>Hi,</p>',
          '<p>We received a request to reset your Paw Connection password.</p>',
          `<p><a href="${resetUrl}">Reset your password</a></p>`,
          '<p>This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>',
        ].join(''),
      });
    }

    return {
      message:
        'If an account exists for that email, password reset instructions were sent.',
    };
  }
}

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly resetTokens: IPasswordResetTokenRepository,
  ) {}

  async execute(input: { token: string; password: string }) {
    const token = input.token.trim();
    if (!token) {
      throw new ValidationError('Reset token is required');
    }

    const tokenHash = hashPasswordResetToken(token);
    const record = await this.resetTokens.findValidByTokenHash(tokenHash);
    if (!record) {
      throw new ValidationError('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    await this.users.updatePasswordHash(record.userId, passwordHash);
    await this.resetTokens.markUsed(record.id);
    await this.resetTokens.deleteByUserId(record.userId);

    return { message: 'Password updated successfully' };
  }
}
