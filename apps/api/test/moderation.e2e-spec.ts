import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/shared/infrastructure/filters/domain-exception.filter';

describe('Moderation (e2e)', () => {
  let app: INestApplication<App>;
  let tokenA: string;
  let tokenB: string;
  let userAId: string;
  let userBId: string;
  let handleB: string;
  let postId: string;

  const register = async (label: string) => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `moderation-${label}-${Date.now()}@paw.test`,
        password: 'password123',
        fullName: `Moderation ${label}`,
      })
      .expect(201);
    return res.body as { accessToken: string; user: { id: string; handle: string } };
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();

    const a = await register('a');
    const b = await register('b');
    tokenA = a.accessToken;
    tokenB = b.accessToken;
    userAId = a.user.id;
    userBId = b.user.id;
    handleB = b.user.handle;

    await request(app.getHttpServer())
      .post('/profile/me/onboarding/complete')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(201);
    await request(app.getHttpServer())
      .post('/profile/me/onboarding/complete')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(201);

    const post = await request(app.getHttpServer())
      .post('/feed/posts')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ body: 'A post that may be reported', imageUrls: [] })
      .expect(201);
    postId = post.body.id as string;
  });

  afterAll(async () => {
    await app.close();
  });

  it('reports a publication', async () => {
    const res = await request(app.getHttpServer())
      .post(`/feed/posts/${postId}/report`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ reason: 'spam' })
      .expect(201);

    expect(res.body.reported).toBe(true);
    expect(res.body.reportId).toBeTruthy();
    expect(res.body.duplicate).toBe(false);
  });

  it('is idempotent when reporting the same post twice', async () => {
    const res = await request(app.getHttpServer())
      .post(`/feed/posts/${postId}/report`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ reason: 'hate' })
      .expect(201);
    expect(res.body.duplicate).toBe(true);
  });

  it('rejects reporting your own post', async () => {
    await request(app.getHttpServer())
      .post(`/feed/posts/${postId}/report`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ reason: 'spam' })
      .expect(400);
  });

  it('hides the author after a block', async () => {
    await request(app.getHttpServer())
      .post(`/users/${userBId}/block`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(201);

    const feed = await request(app.getHttpServer())
      .get('/feed/posts')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect((feed.body as { id: string }[]).some((p) => p.id === postId)).toBe(false);

    await request(app.getHttpServer())
      .post(`/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'should fail' })
      .expect(403);

    await request(app.getHttpServer())
      .get(`/profile/public/${handleB}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(404);

    await request(app.getHttpServer())
      .post('/conversations')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ participantUserId: userAId })
      .expect(403);

    const blocks = await request(app.getHttpServer())
      .get('/blocks')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(blocks.body.items.some((u: { id: string }) => u.id === userBId)).toBe(true);
  });

  it('restores visibility after unblock', async () => {
    await request(app.getHttpServer())
      .delete(`/users/${userBId}/block`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const feed = await request(app.getHttpServer())
      .get('/feed/posts')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect((feed.body as { id: string }[]).some((p) => p.id === postId)).toBe(true);
  });
});
