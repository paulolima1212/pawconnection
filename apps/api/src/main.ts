import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './shared/infrastructure/filters/domain-exception.filter';
import { SupabaseService } from './shared/infrastructure/supabase/supabase.service';

const isProduction = process.env.NODE_ENV === 'production';

function parseCorsOrigins():
  | boolean
  | string[]
  | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void) {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) return true;

  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) return true;

  const localOrigin = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/;

  return (origin, callback) => {
    if (!origin || origins.includes(origin) || localOrigin.test(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin ${origin} not allowed by CORS`), false);
  };
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: isProduction ? ['error', 'warn', 'log'] : undefined,
  });

  app.enableShutdownHooks();

  if (isProduction) {
    app.set('trust proxy', 1);
    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
      }),
    );
    app.disable('x-powered-by');
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new DomainExceptionFilter());

  app.enableCors({
    origin: parseCorsOrigins(),
    credentials: true,
  });
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  const publicApiUrl =
    process.env.PUBLIC_API_URL ?? `http://localhost:${process.env.PORT ?? 3001}`;

  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Paw Connection API')
      .setDescription('Backend for Paw Connection mobile app')
      .setVersion('1.0')
      .addServer(publicApiUrl)
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  }

  const supabase = app.get(SupabaseService);
  await supabase.ensureStorageBucket();

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
  console.log(`Paw Connection API running on ${publicApiUrl}`);
  if (!isProduction) {
    console.log(`Swagger docs: ${publicApiUrl}/docs`);
  }
  console.log(`App origin: ${process.env.APP_URL ?? 'not set'}`);
  console.log(`Supabase: ${process.env.SUPABASE_URL ?? 'not set'}`);
}

bootstrap();
