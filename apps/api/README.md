# Paw Connection API

Backend NestJS para o app **Paw Connection**, com Prisma, DDD e integração Supabase self-hosted.

## Pré-requisitos

- Node.js 20+
- Supabase self-hosted (PostgreSQL na porta `54321`, API em `http://localhost:8000`)

## Configuração

```bash
cd apps/api
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

API: `http://localhost:3000`  
Swagger: `http://localhost:3000/docs`

## Supabase

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | PostgreSQL do Supabase (pooler `:54321`) |
| `SUPABASE_URL` | Gateway Kong (`http://localhost:8000`) |
| `SUPABASE_SERVICE_KEY` | Service role key para Storage |
| `SUPABASE_STORAGE_BUCKET` | Bucket de mídia (`paw-media`) |

Uploads usam Supabase Storage; se o bucket falhar, há fallback local em `uploads/`.

## Usuários de seed

| Email | Senha |
|-------|-------|
| neo@paw.test | password123 |
| sarah@paw.test | password123 |
| jefferson@paw.test | password123 |

## Endpoints principais

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `GET /profile/me`, `PATCH /profile/me/owner`, `PATCH /profile/me/pet`
- `GET /inbox/requests`, `POST /inbox/requests/:id/accept`
- `GET /match/candidates`, `POST /match/candidates/:userId/wave`
- `GET /feed/posts`, `POST /feed/posts`
- `POST /media/upload`
