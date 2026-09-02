import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import WebSocket from 'ws';
import type { Server } from 'http';
import { AddressInfo } from 'net';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/shared/infrastructure/filters/domain-exception.filter';

function wsUrl(port: number, token: string): string {
  return `ws://127.0.0.1:${port}/realtime/chat?token=${encodeURIComponent(token)}`;
}

function connectWs(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const timer = setTimeout(() => {
      ws.terminate();
      reject(new Error('WebSocket connection timeout'));
    }, 8000);
    const onMessage = (raw: WebSocket.RawData) => {
      try {
        const parsed = JSON.parse(raw.toString()) as { type?: string };
        if (parsed.type === 'connected') {
          clearTimeout(timer);
          ws.off('message', onMessage);
          resolve(ws);
        }
      } catch {
        /* ignore */
      }
    };
    ws.on('message', onMessage);
    ws.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    ws.on('close', () => {
      clearTimeout(timer);
    });
  });
}

function waitForEvent(ws: WebSocket, type: string, timeoutMs = 8000): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${type}`)), timeoutMs);
    const onMessage = (raw: WebSocket.RawData) => {
      try {
        const parsed = JSON.parse(raw.toString()) as Record<string, unknown>;
        if (parsed.type === type) {
          clearTimeout(timer);
          ws.off('message', onMessage);
          resolve(parsed);
        }
      } catch {
        /* ignore */
      }
    };
    ws.on('message', onMessage);
  });
}

describe('Chat realtime (e2e)', () => {
  let app: INestApplication<App>;
  let port: number;
  let tokenA: string;
  let tokenB: string;
  let userBId: string;
  let conversationId: string;

  const register = async (label: string) => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `chat-ws-${label}-${Date.now()}@paw.test`,
        password: 'password123',
        fullName: `WS ${label}`,
        handle: `w${label}${Date.now()}`.slice(0, 20),
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
    await app.listen(0);
    const address = (app.getHttpServer() as Server).address() as AddressInfo;
    port = address.port;

    const a = await register('a');
    const b = await register('b');
    tokenA = a.accessToken;
    tokenB = b.accessToken;
    userBId = b.user.id;

    for (const token of [tokenA, tokenB]) {
      await request(app.getHttpServer())
        .post('/profile/me/onboarding/complete')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);
    }

    const conv = await request(app.getHttpServer())
      .post('/conversations')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ participantUserId: userBId })
      .expect(201);
    conversationId = conv.body.id;
  });

  afterAll(async () => {
    await app.close();
  }, 15000);

  it('rejects connection without a valid token', async () => {
    let sawConnected = false;
    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(wsUrl(port, 'not-a-jwt'));
      const timer = setTimeout(() => {
        ws.terminate();
        reject(new Error('Expected unauthorized close'));
      }, 4000);
      ws.on('message', (raw) => {
        try {
          const parsed = JSON.parse(raw.toString()) as { type?: string };
          if (parsed.type === 'connected') sawConnected = true;
        } catch {
          /* ignore */
        }
      });
      ws.on('close', () => {
        clearTimeout(timer);
        try {
          expect(sawConnected).toBe(false);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  });

  it('authenticates and receives connected event', async () => {
    const ws = await connectWs(wsUrl(port, tokenA));
    expect(ws.readyState).toBe(WebSocket.OPEN);
    ws.close();
  });

  it('delivers new_message to recipient over WebSocket', async () => {
    const wsB = await connectWs(wsUrl(port, tokenB));
    wsB.send(JSON.stringify({ type: 'join_conversation', conversationId }));

    const received = waitForEvent(wsB, 'new_message');

    await request(app.getHttpServer())
      .post(`/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'Realtime hello', clientMessageId: `ws-${Date.now()}` })
      .expect(201);

    const event = await received;
    expect(event.message).toBeTruthy();
    wsB.close();
  });

  it('sends message via WebSocket and acks sender', async () => {
    const wsA = await connectWs(wsUrl(port, tokenA));
    wsA.send(JSON.stringify({ type: 'join_conversation', conversationId }));

    const ackPromise = waitForEvent(wsA, 'message_ack');
    wsA.send(
      JSON.stringify({
        type: 'send_message',
        conversationId,
        content: 'From socket',
        clientMessageId: `ws-send-${Date.now()}`,
      }),
    );

    const ack = await ackPromise;
    expect(ack.message).toBeTruthy();
    wsA.close();
  });
});
