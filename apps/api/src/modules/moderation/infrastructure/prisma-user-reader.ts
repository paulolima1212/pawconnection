import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { SupabaseService } from '../../../shared/infrastructure/supabase/supabase.service';
import {
  IModerationUserReader,
  ModerationUserSummary,
} from '../domain/ports/user-reader.port';

@Injectable()
export class PrismaModerationUserReader implements IModerationUserReader {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async exists(userId: string): Promise<boolean> {
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    return Boolean(row);
  }

  async findSummariesByIds(ids: string[]): Promise<ModerationUserSummary[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, fullName: true, handle: true, photoUrl: true },
    });
    return rows.map((row) => ({
      id: row.id,
      fullName: row.fullName,
      handle: row.handle,
      photoUrl: this.supabase.normalizePublicUrl(row.photoUrl),
    }));
  }
}
