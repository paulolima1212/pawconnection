import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { randomUUID } from 'crypto';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../auth/presentation/jwt-auth.guard';
import { SupabaseService } from '../../../shared/infrastructure/supabase/supabase.service';
import * as fs from 'fs/promises';
import * as path from 'path';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE = 5 * 1024 * 1024;

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {}

  private toAbsoluteUrl(pathOrUrl: string): string {
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      return pathOrUrl;
    }
    const base = (
      this.config.get<string>('PUBLIC_API_URL') ??
      `http://localhost:${this.config.get<string>('PORT') ?? 3001}`
    ).replace(/\/$/, '');
    return `${base}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_SIZE },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException('Invalid file type');
    }

    const ext = file.mimetype.split('/')[1];
    const filename = `${randomUUID()}.${ext}`;

    try {
      const url = await this.supabase.uploadFile(
        `uploads/${filename}`,
        file.buffer,
        file.mimetype,
      );
      return { url: this.supabase.normalizePublicUrl(url) ?? url };
    } catch {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      const localPath = path.join(uploadsDir, filename);
      await fs.writeFile(localPath, file.buffer);
      return { url: this.toAbsoluteUrl(`/uploads/${filename}`) };
    }
  }

  private normalizeStoragePath(storagePath: string): string {
    const clean = storagePath.replace(/^\/+/, '');
    const bucket = this.supabase.storageBucket;
    if (clean.startsWith(`${bucket}/`)) {
      return clean.slice(bucket.length + 1);
    }
    return clean;
  }

  /** Public image proxy (local disk or Supabase) for mobile clients on LAN/Tailscale. */
  @Get('object')
  async serveObject(@Query('path') storagePath: string, @Res() res: Response) {
    if (!storagePath || storagePath.includes('..')) {
      throw new NotFoundException('File not found');
    }

    const objectPath = this.normalizeStoragePath(storagePath);
    const ext = path.extname(objectPath).toLowerCase();
    const mime =
      ext === '.png'
        ? 'image/png'
        : ext === '.webp'
          ? 'image/webp'
          : ext === '.gif'
            ? 'image/gif'
            : 'image/jpeg';

    const localName = path.basename(objectPath);
    const localPath = path.join(process.cwd(), 'uploads', localName);
    try {
      const buf = await fs.readFile(localPath);
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buf);
      return;
    } catch {
      /* try Supabase */
    }

    const { data, error } = await this.supabase.client.storage
      .from(this.supabase.storageBucket)
      .download(objectPath);
    if (error || !data) {
      throw new NotFoundException('File not found');
    }
    const buf = Buffer.from(await data.arrayBuffer());
    res.setHeader('Content-Type', data.type || mime);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buf);
  }
}
