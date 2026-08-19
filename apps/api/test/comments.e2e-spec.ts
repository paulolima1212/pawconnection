import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/shared/infrastructure/filters/domain-exception.filter';

describe('Comments (e2e)', () => {
  let app: INestApplication<App>;
  let tokenA: string;
  let tokenB: string;
  let postId: string;

  const register = async (label: string) => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `comments-${label}-${Date.now()}@paw.test`,
        password: 'password123',
        fullName: `Commenter ${label}`,
      })
      .expect(201);
    return res.body.accessToken as string;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();

    tokenA = await register('a');
    tokenB = await register('b');

    const post = await request(app.getHttpServer())
      .post('/feed/posts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ body: 'A post to comment on', imageUrls: [] })
      .expect(201);
    postId = post.body.id as string;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated comment creation', () =>
    request(app.getHttpServer())
      .post(`/posts/${postId}/comments`)
      .send({ content: 'nope' })
      .expect(401));

  it('returns 404 when commenting on a missing post', () =>
    request(app.getHttpServer())
      .post('/posts/does-not-exist/comments')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'hi' })
      .expect(404));

  it('rejects empty content', () =>
    request(app.getHttpServer())
      .post(`/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: '   ' })
      .expect(400));

  let commentId: string;
  let replyId: string;

  it('creates a top-level comment', async () => {
    const res = await request(app.getHttpServer())
      .post(`/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'First!' })
      .expect(201);
    expect(res.body.status).toBe('ACTIVE');
    expect(res.body.parentCommentId).toBeNull();
    expect(res.body.author).toBeTruthy();
    commentId = res.body.id;
  });

  it('sanitizes HTML in content', async () => {
    const res = await request(app.getHttpServer())
      .post(`/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: '<script>alert(1)</script>clean' })
      .expect(201);
    expect(res.body.content).not.toMatch(/</);
    expect(res.body.content).toContain('clean');
  });

  it('lets another user reply to a comment', async () => {
    const res = await request(app.getHttpServer())
      .post(`/comments/${commentId}/replies`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ content: 'Nice comment' })
      .expect(201);
    expect(res.body.parentCommentId).toBe(commentId);
    replyId = res.body.id;
  });

  it('forbids editing a comment you do not own', () =>
    request(app.getHttpServer())
      .put(`/comments/${commentId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ content: 'hijack' })
      .expect(403));

  it('lets the author edit their comment', async () => {
    const res = await request(app.getHttpServer())
      .put(`/comments/${commentId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'First (edited)' })
      .expect(200);
    expect(res.body.edited).toBe(true);
    expect(res.body.content).toBe('First (edited)');
  });

  it('lists the comment tree with the reply nested', async () => {
    const res = await request(app.getHttpServer())
      .get(`/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    const top = res.body.items.find((c: { id: string }) => c.id === commentId);
    expect(top).toBeTruthy();
    expect(top.replies.some((r: { id: string }) => r.id === replyId)).toBe(true);
  });

  it('counts visible comments', async () => {
    const res = await request(app.getHttpServer())
      .get(`/posts/${postId}/comments/count`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(res.body.count).toBeGreaterThanOrEqual(3);
  });

  it('forbids deleting a comment you do not own', () =>
    request(app.getHttpServer())
      .delete(`/comments/${commentId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(403));

  it('soft-deletes a comment and keeps its replies as a tombstone', async () => {
    await request(app.getHttpServer())
      .delete(`/comments/${commentId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const res = await request(app.getHttpServer())
      .get(`/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    const tombstone = res.body.items.find((c: { id: string }) => c.id === commentId);
    expect(tombstone.deleted).toBe(true);
    expect(tombstone.content).toBe('[deleted]');
    expect(tombstone.replies.some((r: { id: string }) => r.id === replyId)).toBe(true);
  });
});
