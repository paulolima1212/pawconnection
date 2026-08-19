import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  readonly client: SupabaseClient;
  readonly storageBucket: string;
  /** Public-facing Supabase URL (never localhost). Used for storage links returned to clients. */
  private readonly publicStorageBase: string;

  constructor(private readonly config: ConfigService) {
    const url = this.config.getOrThrow<string>('SUPABASE_URL');
    const key = this.config.getOrThrow<string>('SUPABASE_SERVICE_KEY');
    this.storageBucket = this.config.get<string>(
      'SUPABASE_STORAGE_BUCKET',
      'paw-media',
    );
    this.publicStorageBase = (
      this.config.get<string>('SUPABASE_PUBLIC_URL') ??
      this.config.get<string>('SUPABASE_URL') ??
      url
    ).replace(/\/$/, '');

    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(this.publicStorageBase)) {
      this.logger.warn(
        'Set SUPABASE_PUBLIC_URL to your public gateway (e.g. https://supabase.lz-plima1212.online) so storage links are not localhost.',
      );
    }

    this.client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { transport: ws as never },
    });
  }

  async ensureStorageBucket(): Promise<void> {
    const { data: buckets, error } = await this.client.storage.listBuckets();
    if (error) {
      this.logger.warn(`Could not list Supabase buckets: ${error.message}`);
      return;
    }
    if (!buckets?.some((b) => b.name === this.storageBucket)) {
      const { error: createError } = await this.client.storage.createBucket(
        this.storageBucket,
        { public: true },
      );
      if (createError) {
        this.logger.warn(
          `Could not create bucket "${this.storageBucket}": ${createError.message}`,
        );
      }
    }
  }

  getPublicUrl(path: string): string {
    const objectPath = path.replace(/^\//, '');
    const key = objectPath.startsWith(`${this.storageBucket}/`)
      ? objectPath
      : `${this.storageBucket}/${objectPath}`;
    return `${this.publicStorageBase}/storage/v1/object/public/${key}`;
  }

  /** Rewrites legacy localhost Supabase storage URLs to the public gateway. */
  normalizePublicUrl(url: string | null | undefined): string | null {
    if (!url?.trim()) return null;
    const trimmed = url.trim();
    const marker = '/storage/v1/object/public/';
    const idx = trimmed.indexOf(marker);
    if (idx >= 0) {
      const objectKey = trimmed.slice(idx + marker.length);
      return `${this.publicStorageBase}${marker}${objectKey}`;
    }
    return trimmed;
  }

  async uploadFile(
    path: string,
    file: Buffer,
    contentType: string,
  ): Promise<string> {
    const { error } = await this.client.storage
      .from(this.storageBucket)
      .upload(path, file, { contentType, upsert: true });
    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }
    return this.getPublicUrl(path);
  }
}
