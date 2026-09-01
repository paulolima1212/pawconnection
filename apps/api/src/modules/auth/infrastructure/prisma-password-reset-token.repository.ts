import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import {
  IPasswordResetTokenRepository,
  PasswordResetTokenRecord,
} from '../domain/repositories/password-reset-token.repository';

@Injectable()
export class PrismaPasswordResetTokenRepository
  implements IPasswordResetTokenRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.passwordResetToken.deleteMany({ where: { userId } });
  }

  async create(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.prisma.passwordResetToken.create({ data: input });
  }

  async findValidByTokenHash(
    tokenHash: string,
  ): Promise<PasswordResetTokenRecord | null> {
    const row = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true, userId: true, expiresAt: true },
    });
    return row;
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }
}
