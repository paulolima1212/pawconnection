import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/shared/infrastructure/filters/domain-exception.filter';

describe('Profile (e2e)', () => {
  let app: INestApplication<App>;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /profile/me returns 401 without token', () => {
    return request(app.getHttpServer()).get('/profile/me').expect(401);
  });

  it('register → onboarding → GET /profile/me', async () => {
    const email = `test-${Date.now()}@paw.test`;

    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password: 'password123',
        fullName: 'Walking Phoebe',
      })
      .expect(201);

    const token = register.body.accessToken as string;
    expect(token).toBeDefined();

    await request(app.getHttpServer())
      .put('/profile/me/looking-for')
      .set('Authorization', `Bearer ${token}`)
      .send({ lookingFor: ['Friendship', 'Meet people'] })
      .expect(200);

    await request(app.getHttpServer())
      .put('/profile/me/interests')
      .set('Authorization', `Bearer ${token}`)
      .send({ interests: ['Friendship', 'Dog playdates'] })
      .expect(200);

    await request(app.getHttpServer())
      .patch('/profile/me/owner')
      .set('Authorization', `Bearer ${token}`)
      .send({ age: 28, location: 'Austin, TX' })
      .expect(200);

    await request(app.getHttpServer())
      .patch('/profile/me/pet')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Phoebe', breed: 'Mixed' })
      .expect(200);

    const profile = await request(app.getHttpServer())
      .get('/profile/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(profile.body.owner.fullName).toBe('Walking Phoebe');
    expect(profile.body.pet.name).toBe('Phoebe');
    expect(profile.body.interests).toContain('Friendship');
    expect(profile.body.lookingFor).toEqual(
      expect.arrayContaining(['Friendship', 'Meet people']),
    );
  });
});
