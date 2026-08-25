import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../../shared/infrastructure/supabase/supabase.service';
import { IAccountMediaCleaner } from '../domain/ports/account-media-cleaner.port';

@Injectable()
export class SupabaseAccountMediaCleaner implements IAccountMediaCleaner {
  constructor(private readonly supabase: SupabaseService) {}

  removeObjectUrls(urls: string[]): Promise<void> {
    return this.supabase.removePublicUrls(urls);
  }
}
