import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/shared/infrastructure/filters/domain-exception.filter';

describe('Chat (e2e)', () => {
  let app: INestApplication<App>;
  let tokenA: string;
  let tokenB: string;
  let userAId: string;
  let userBId: string;

  const register = async (label: string) => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `chat-${label}-${Date.now()}@paw.test`,
        password: 'password123',
        fullName: `Chatter ${label}`,
        handle: `h${label}${Date.now()}`.slice(0, 20),
      })
      .expect(201);
    return res.body as { accessToken: string; user: { id: string } };
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

    await request(app.getHttpServer())
      .post('/profile/me/onboarding/complete')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(201);
    await request(app.getHttpServer())
      .post('/profile/me/onboarding/complete')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  let conversationId: string;

  it('rejects unauthenticated conversation creation', () =>
    request(app.getHttpServer())
      .post('/conversations')
      .send({ participantUserId: userBId })
      .expect(401));

  it('creates a conversation between two users', async () => {
    const res = await request(app.getHttpServer())
      .post('/conversations')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ participantUserId: userBId })
      .expect(201);

    expect(res.body.id).toBeTruthy();
    expect(res.body.otherUser).toBeTruthy();
    conversationId = res.body.id;
  });

  it('returns the same conversation on duplicate create', async () => {
    const res = await request(app.getHttpServer())
      .post('/conversations')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ participantUserId: userBId })
      .expect(201);
    expect(res.body.id).toBe(conversationId);
  });

  it('sends and lists messages', async () => {
    const sent = await request(app.getHttpServer())
      .post(`/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'Woof!', clientMessageId: 'client-1' })
      .expect(201);

    expect(sent.body.content).toBe('Woof!');

    const list = await request(app.getHttpServer())
      .get(`/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    expect(list.body.items.length).toBeGreaterThanOrEqual(1);
    expect(list.body.items.some((m: { content: string }) => m.content === 'Woof!')).toBe(true);
  });

  it('is idempotent for clientMessageId', async () => {
    const first = await request(app.getHttpServer())
      .post(`/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'Once', clientMessageId: 'dup-key' })
      .expect(201);

    const second = await request(app.getHttpServer())
      .post(`/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'Once', clientMessageId: 'dup-key' })
      .expect(201);

    expect(second.body.id).toBe(first.body.id);
  });

  it('marks conversation as read', async () => {
    const res = await request(app.getHttpServer())
      .post(`/conversations/${conversationId}/read`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(201);
    expect(res.body.marked).toBeGreaterThanOrEqual(0);
  });

  it('lists conversations for participant', async () => {
    const res = await request(app.getHttpServer())
      .get('/conversations')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((c: { id: string }) => c.id === conversationId)).toBe(true);
  });

  it('blocks messaging after a user is blocked', async () => {
    await request(app.getHttpServer())
      .post(`/users/${userBId}/block`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(201);

    await request(app.getHttpServer())
      .post('/conversations')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ participantUserId: userAId })
      .expect(403);

    await request(app.getHttpServer())
      .post(`/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'should fail' })
      .expect(403);

    const conversation = await request(app.getHttpServer())
      .get(`/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(conversation.body.blockedByMe).toBe(true);

    await request(app.getHttpServer())
      .delete(`/users/${userBId}/block`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
  });
});
