# Paw Connection API

Backend NestJS para o app **Paw Connection**, seguindo **Clean Architecture**, **DDD**, e **TDD**.

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 20+ (preferencialmente 20.19.4+)
- PostgreSQL (via Docker ou instalado localmente)
- npm ou yarn

### Instalação e Configuração

```bash
cd apps/api

# Copiar .env de exemplo
cp .env.example .env

# Instalar dependências
npm install

# Rodar migrations do Prisma
npx prisma migrate dev

# Popular banco com dados de seed
npx prisma db seed

# Iniciar servidor de desenvolvimento
npm run start:dev
```

**API:** `http://localhost:3001`  
**Swagger/Docs:** `http://localhost:3001/docs`

## 🗄️ Banco de Dados

### PostgreSQL

A API usa PostgreSQL via Prisma ORM. Configure `DATABASE_URL` no `.env`:

```env
# Docker Compose (recomendado para dev)
DATABASE_URL="postgresql://postgres:paw@localhost:5432/paw_connection?schema=public"

# Ou Supabase local
DATABASE_URL="postgresql://postgres.your-tenant-id:YOUR_PASSWORD@localhost:54321/postgres?schema=public"
```

**Iniciar PostgreSQL via Docker:**

```bash
# Na raiz do monorepo
docker compose up -d postgres
```

### Prisma

**Comandos úteis:**

```bash
# Gerar Prisma Client após alterar schema
npx prisma generate

# Criar nova migration
npx prisma migrate dev --name <descricao>

# Aplicar migrations em produção
npx prisma migrate deploy

# Abrir Prisma Studio (UI para visualizar/editar dados)
npx prisma studio

# Resetar banco (dev only — apaga tudo e re-executa migrations + seed)
npx prisma migrate reset
```

## 🗂️ Arquitetura

### Clean Architecture + DDD

```
src/
├── main.ts                    # Bootstrap da aplicação
├── app.module.ts
├── shared/                    # Código compartilhado
│   ├── domain/                # Entidades base, Result, Specification
│   └── infrastructure/        # PrismaService, SupabaseService, guards, filters
└── modules/                   # Bounded contexts (DDD)
    ├── auth/                  # Registro, login, JWT
    ├── profile/               # Owner + Pet
    ├── inbox/                 # Connection requests
    ├── match/                 # Discovery/match
    ├── feed/                  # Posts, likes, comentários
    ├── chat/                  # Mensagens WebSocket
    └── media/                 # Upload de imagens
```

**Por módulo:**

- `domain/` — Entidades, Value Objects, Specifications, interfaces de repositório
- `application/` — Use Cases
- `infrastructure/` — Implementações Prisma, adaptadores externos
- `presentation/` — Controllers HTTP, DTOs, guards

### Princípios

- **SOLID** — Separação de responsabilidades, inversão de dependências via tokens
- **DDD** — Bounded contexts, ubiquitous language, entidades ricas
- **TDD** — Testes unitários (specs), integração (use cases), E2E (supertest)

Veja `.cursor/rules/` na raiz do monorepo para guidelines completos.

## 📦 Supabase (Storage)

O projeto usa **Supabase Storage** para upload de mídia (fotos de perfil, posts). Se Supabase falhar ou não estiver configurado, a API salva arquivos localmente em `uploads/`.

### Configuração no `.env`

```env
SUPABASE_URL="http://localhost:8000"            # URL da API do Supabase
SUPABASE_PUBLIC_URL="http://localhost:8000"     # URL pública (para links de storage)
SUPABASE_ANON_KEY="your-anon-key"               # Anon key
SUPABASE_SERVICE_KEY="your-service-role-key"    # Service role key (admin)
SUPABASE_STORAGE_BUCKET="paw-media"             # Nome do bucket
```

**Opções:**

1. **Supabase Cloud:** Crie um projeto em [supabase.com](https://supabase.com), copie as chaves e crie o bucket `paw-media`.
2. **Supabase Self-hosted (Docker):** Rode o compose oficial do Supabase localmente.
3. **Sem Supabase (fallback):** Deixe variáveis vazias; uploads irão para `uploads/` (local disk).

## 🔑 Variáveis de Ambiente

Todas as variáveis estão documentadas em `.env.example`. Principais:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | Connection string PostgreSQL | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | Segredo para assinar tokens JWT | `change-me-in-production` |
| `JWT_EXPIRES_IN` | Expiração do token | `7d` |
| `PORT` | Porta da API | `3001` |
| `PUBLIC_API_URL` | URL pública da API | `http://localhost:3001` |
| `APP_URL` | URL do app mobile | `http://localhost:8081` |
| `CORS_ORIGINS` | Origens permitidas (CORS) | `http://localhost:8081` (ou vazio para aceitar localhost/LAN) |
| `SUPABASE_*` | Configuração Supabase | (ver acima) |

> **Importante:** Nunca commite `.env` com credenciais reais. Use `.env.example` apenas com placeholders.

## 👥 Usuários de Seed

O seed (`prisma/seed.ts`) cria usuários de teste:

| Email | Senha | Nome |
|-------|-------|------|
| `neo@paw.test` | `password123` | Neo |
| `sarah@paw.test` | `password123` | Sarah |
| `jefferson@paw.test` | `password123` | Jefferson |

Use esses usuários para login durante desenvolvimento.

## 🌐 Endpoints Principais

**Auth:**
- `POST /auth/register` — Registrar novo usuário
- `POST /auth/login` — Login (retorna JWT)
- `GET /auth/me` — Dados do usuário autenticado

**Profile:**
- `GET /profile/me` — Meu perfil (owner + pet)
- `PATCH /profile/me/owner` — Atualizar dados do dono
- `PATCH /profile/me/pet` — Atualizar dados do pet
- `PUT /profile/me/interests` — Definir interesses
- `POST /profile/me/onboarding/complete` — Marcar onboarding como completo
- `GET /profile/public/:handle` — Buscar perfil público por handle (@nomedodog)

**Inbox (Connection Requests):**
- `GET /inbox/requests` — Listar pedidos (query: `type`, `direction`)
- `POST /inbox/requests/:id/accept` — Aceitar pedido
- `POST /inbox/requests/:id/reject` — Rejeitar pedido

**Match:**
- `GET /match/candidates` — Listar candidatos para match
- `POST /match/candidates/:userId/wave` — Enviar "wave" (interesse)
- `POST /match/candidates/:userId/pass` — Pass (descartar candidato)

**Feed:**
- `GET /feed/posts` — Listar posts (query: `radiusKm`, `scope`, `search`, `city`)
- `POST /feed/posts` — Criar novo post
- `POST /feed/posts/:id/like` — Toggle like
- `GET /feed/posts/:id/comments` — Listar comentários
- `POST /feed/posts/:id/comments` — Criar comentário

**Media:**
- `POST /media/upload` — Upload de imagem (multipart/form-data, campo `file`)

**Chat (WebSocket):**
- `ws://localhost:3001/chat` — WebSocket endpoint para mensagens em tempo real

Veja documentação completa em `http://localhost:3001/docs` (Swagger) quando a API estiver rodando.

## 🧪 Testes

```bash
# Testes unitários
npm test

# Testes E2E
npm run test:e2e

# Coverage
npm run test:cov

# Watch mode
npm run test:watch
```

**Estrutura de testes:**

- Unitários: `src/**/domain/**/*.spec.ts`, `src/**/application/**/*.spec.ts`
- E2E: `test/**/*.e2e-spec.ts`

## 🚀 Deploy

### Build

```bash
npm run build
```

Gera código compilado em `dist/`.

### Produção

```bash
npm run start:prod
```

Ou use Docker:

```bash
cd apps/api
docker build -t paw-connection-api .
docker run -p 3001:3001 --env-file .env paw-connection-api
```

Veja `docker-compose.prod.yml` para exemplo de deploy com docker-compose.

### Variáveis de Produção

- `NODE_ENV=production`
- `JWT_SECRET` — use um segredo forte e único
- `DATABASE_URL` — aponte para banco de produção (RDS, Supabase Cloud, etc.)
- `CORS_ORIGINS` — liste domínios específicos permitidos
- `PUBLIC_API_URL` — URL pública da API (https)
- `SUPABASE_*` — credenciais de produção

## 🔒 Segurança

- **JWT:** Tokens assinados com `JWT_SECRET`, expiração configurável
- **CORS:** Configurado em `main.ts`, aceita localhost/LAN em dev, origens específicas em prod
- **Rate Limiting:** Via `@nestjs/throttler` (configurado globalmente)
- **Validation:** DTOs com `class-validator`, `ValidationPipe` global
- **Helmet:** Headers de segurança em produção
- **Secrets:** Nunca commite `.env`, keystores, ou credenciais

## 🛠️ Scripts

| Script | Descrição |
|--------|-----------|
| `npm run start:dev` | Desenvolvimento com hot-reload |
| `npm run build` | Build para produção |
| `npm run start:prod` | Rodar build de produção |
| `npm run lint` | Lint do código |
| `npm test` | Testes unitários |
| `npm run test:e2e` | Testes E2E |
| `npm run test:cov` | Coverage |
| `npx prisma studio` | Abrir Prisma Studio |
| `npx prisma migrate dev` | Criar migration |
| `npx prisma db seed` | Popular banco |

## 📚 Documentação Adicional

- **Monorepo:** `README.md` (raiz do projeto)
- **App Mobile:** `apps/app/README.md`
- **Regras do projeto:** `.cursor/rules/` (convenções Git, DDD, TDD, etc.)
- **Guia de desenvolvimento DDD:** `backend-nestjs-passo-a-passo.md` (raiz)

---

**Desenvolvido com ❤️ e 🐾**
