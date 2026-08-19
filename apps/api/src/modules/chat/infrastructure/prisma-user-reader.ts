import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { SupabaseService } from '../../../shared/infrastructure/supabase/supabase.service';
import { IChatUserReader, ChatUserSnapshot } from '../domain/ports/user-reader.port';

@Injectable()
export class PrismaChatUserReader implements IChatUserReader {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  private map(user: {
    id: string;
    fullName: string;
    handle: string;
    photoUrl: string | null;
    onboardingComplete: boolean;
  }): ChatUserSnapshot {
    return {
      id: user.id,
      fullName: user.fullName,
      handle: user.handle,
      photoUrl: this.supabase.normalizePublicUrl(user.photoUrl),
      onboardingComplete: user.onboardingComplete,
    };
  }

  async findById(userId: string): Promise<ChatUserSnapshot | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        handle: true,
        photoUrl: true,
        onboardingComplete: true,
      },
    });
    return user ? this.map(user) : null;
  }

  async findByHandle(handle: string): Promise<ChatUserSnapshot | null> {
    const normalized = handle.replace(/^@+/, '').trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: { handle: { equals: normalized, mode: 'insensitive' } },
      select: {
        id: true,
        fullName: true,
        handle: true,
        photoUrl: true,
        onboardingComplete: true,
      },
    });
    return user ? this.map(user) : null;
  }
}
