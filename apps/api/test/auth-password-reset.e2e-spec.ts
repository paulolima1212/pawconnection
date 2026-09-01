import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/shared/infrastructure/filters/domain-exception.filter';
import { PrismaService } from '../src/shared/infrastructure/prisma/prisma.service';
import { hashPasswordResetToken } from '../src/modules/auth/domain/password-reset-token.util';

describe('Auth password reset (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('forgot-password always returns a generic success message', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'missing@paw.test' })
      .expect(201);

    expect(response.body.message).toContain('If an account exists');
  });

  it('register → reset-password → login with new password', async () => {
    const email = `reset-${Date.now()}@paw.test`;
    const oldPassword = 'password123';
    const newPassword = 'newpassword456';
    const rawToken = 'test-reset-token-abc';

    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password: oldPassword,
        fullName: 'Reset Tester',
      })
      .expect(201);

    const userId = register.body.user.id as string;

    await prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: hashPasswordResetToken(rawToken),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: 'invalid-token', password: newPassword })
      .expect(400);

    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: rawToken, password: newPassword })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: oldPassword })
      .expect(409);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: newPassword })
      .expect(201);

    expect(login.body.accessToken).toBeDefined();
  });
});
