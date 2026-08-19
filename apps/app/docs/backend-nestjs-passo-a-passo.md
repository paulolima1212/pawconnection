# Backend Paw Connection — NestJS + Prisma (SOLID, DDD, Specification Driven)

Este guia descreve como criar um backend para o app **Paw Connection** (Expo/React Native) usando o **contexto de domínio que já existe no mobile**, com **NestJS**, **Prisma**, e os paradigmas **SOLID**, **DDD** e **Specification Driven Development (SDD)**.

> **Resposta curta:** sim, é totalmente possível. O app hoje é UI-only: perfil/onboarding em `ProfileDraft`, inbox e feed com mocks. O backend deve espelhar esses modelos e substituir `AsyncStorage` + dados estáticos por API autenticada.

---

## Índice

1. [Contexto do app mobile (o que o backend deve cobrir)](#1-contexto-do-app-mobile)
2. [Arquitetura proposta](#2-arquitetura-proposta)
3. [SOLID no NestJS](#3-solid-no-nestjs)
4. [DDD — contextos e camadas](#4-ddd--contextos-e-camadas)
5. [Specification Driven Development](#5-specification-driven-development)
6. [Passo a passo (implementação)](#6-passo-a-passo-implementação)
7. [Schema Prisma alinhado ao código](#7-schema-prisma-alinhado-ao-código)
8. [Endpoints mapeados por tela](#8-endpoints-mapeados-por-tela)
9. [Integração com o app Expo](#9-integração-com-o-app-expo)
10. [Checklist de conclusão](#10-checklist-de-conclusão)

---

## 1. Contexto do app mobile

### Stack atual

| Item | Detalhe |
|------|---------|
| Frontend | Expo ~54, React Native, Expo Router |
| Estado | `context/profile-onboarding.tsx` |
| Persistência local | `paw_profile_draft_v1`, `paw_onboarding_complete_v1` |
| Rede | **Nenhuma** chamada HTTP ainda |
| Deep link | scheme `pawconnection`, domínio `pawconnection.app` |

### Modelo central: `ProfileDraft`

Arquivo: `context/profile-onboarding.tsx`

| Campo mobile | Uso no app | Entidade backend sugerida |
|--------------|------------|---------------------------|
| `interests[]` | Onboarding + preferências | `UserInterest` |
| `fullName`, `email`, `phone`, `age`, `humanGender`, `location`, `humanBio`, `humanPhotoUri` | Owner / `setup-you`, Profile | `User` |
| `dogName`, `dogAge`, `breed`, `dogBio`, `temperament`, `vaccinated`, `dogGender`, fotos, preferências | Pet / `setup-dog`, Profile | `Pet` (1 por usuário hoje) |
| `publicHandleFromDraft()` | QR / share (`easy-qr`) | `User.handle` único |

Enums já definidos no app:

- `InterestId`: Friendship, Dog friendly locations, Dog services, Dog playdates, All the above
- `GenderValue`: Male, Female
- `TemperamentValue`: Happy, Calm, Playful, Energetic, Shy, Friendly
- `VaccinatedValue`: Yes, No

### Outros domínios (mocks → API)

| Feature | Arquivo(s) | Estado |
|---------|------------|--------|
| Inbox (romance / friendship / requests) | `constants/inbox-mocks.ts`, `inbox-screen.tsx` | Mock local, Confirm/Delete só na UI |
| Match / Find | `match-feed-screen.tsx` | Card estático, ações sem backend |
| Social feed | `social-feed-screen.tsx`, `constants/feed-discovery-filters.ts` | Post fixo, filtros radius/scope |
| Novo post | `app/new-post.tsx` | Alert: *"once the backend is connected"* |
| Localização feed | `hooks/use-feed-nearby-cities.ts` | GPS + geocode no device |

---

## 2. Arquitetura proposta

Recomendação: **monorepo** com duas pastas no mesmo repositório Git (ou repositório irmão, se preferir deploy separado).

```text
paw-connection/
├── apps/
│   ├── mobile/          # mover o Expo atual para cá (opcional, fase 2)
│   └── api/             # NestJS + Prisma
├── packages/
│   └── shared-types/    # opcional: DTOs/enums compartilhados
└── docs/
    └── backend-nestjs-passo-a-passo.md   # este arquivo
```

Para começar rápido, crie só `apps/api` na raiz do projeto:

```text
/opt/paw-connection/
├── app/                 # Expo (existente)
├── context/             # ProfileDraft (existente)
├── apps/
│   └── api/             # novo backend
└── docs/
```

### Diagrama de camadas (DDD + Nest)

```mermaid
flowchart TB
  subgraph presentation [Presentation - Nest]
    C[Controllers]
    DTO[DTOs + Pipes]
  end
  subgraph application [Application]
    UC[Use Cases / Application Services]
    SPEC[Specifications]
  end
  subgraph domain [Domain]
    ENT[Entities + Value Objects]
    REPO_IF[Repository Interfaces]
    DOM_SVC[Domain Services]
  end
  subgraph infrastructure [Infrastructure]
    PRISMA[Prisma Repositories]
    STORAGE[File Storage S3/local]
    AUTH[JWT / Passport]
  end
  C --> UC
  UC --> SPEC
  UC --> REPO_IF
  SPEC --> ENT
  REPO_IF --> PRISMA
  UC --> STORAGE
  C --> AUTH
```

---

## 3. SOLID no NestJS

| Princípio | Como aplicar no Paw Connection |
|-----------|--------------------------------|
| **S** — Single Responsibility | `AcceptConnectionRequestUseCase` só aceita pedido; upload em `UploadPhotoUseCase`. |
| **O** — Open/Closed | Novos filtros de feed via **Specifications** novas, sem alterar `ListFeedPostsUseCase`. |
| **L** — Liskov Substitution | `IUserRepository` implementado por `PrismaUserRepository`; testes usam `InMemoryUserRepository`. |
| **I** — Interface Segregation | Repositórios pequenos: `IConnectionRequestRepository`, não um `IGodRepository`. |
| **D** — Dependency Inversion | Use cases dependem de **interfaces** (`src/domain/...`), módulos Nest registram implementações Prisma. |

Exemplo de binding (Nest):

```typescript
// apps/api/src/infrastructure/prisma/prisma.module.ts
{
  provide: USER_REPOSITORY,
  useClass: PrismaUserRepository,
}
```

```typescript
// apps/api/src/application/users/update-owner-profile.use-case.ts
@Injectable()
export class UpdateOwnerProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}
}
```

---

## 4. DDD — contextos e camadas

### Bounded contexts (módulos Nest)

| Contexto | Responsabilidade | Módulo Nest |
|----------|------------------|-------------|
| **Identity & Access** | Registro, login, JWT, sessão | `AuthModule` |
| **Profile** | Owner + Pet + onboarding + handle/QR | `ProfileModule` |
| **Connections** | Inbox, pedidos romance/friendship, accept/reject | `ConnectionsModule` |
| **Discovery (Match)** | Candidatos, pass, wave | `MatchModule` |
| **Feed** | Posts, likes, comentários, filtros geo/scope | `FeedModule` |
| **Media** | Upload de fotos (perfil e post) | `MediaModule` |

### Estrutura de pastas por contexto (dentro de `apps/api/src`)

```text
src/
├── main.ts
├── app.module.ts
├── shared/
│   ├── domain/          # base Entity, Specification, Result
│   └── infrastructure/  # PrismaService, guards globais
├── modules/
│   ├── auth/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   ├── profile/
│   ├── connections/
│   ├── match/
│   ├── feed/
│   └── media/
```

### Value Objects (exemplos alinhados ao app)

```typescript
// profile/domain/value-objects/handle.vo.ts
export class Handle {
  private constructor(readonly value: string) {}
  static fromFullName(fullName: string): Handle {
    const base = fullName.trim().toLowerCase().replace(/\s+/g, '') || 'walkingphoebe';
    return new Handle(base);
  }
}
```

Espelha `publicHandleFromDraft()` em `context/profile-onboarding.tsx`.

---

## 5. Specification Driven Development

SDD aqui significa: **especificar comportamento antes (ou junto) da implementação**, com testes como especificação executável.

### Ciclo recomendado por feature

1. **Especificação em texto** — Gherkin ou tabela no PR/issue.
2. **Teste de aceitação** — `*.e2e-spec.ts` (supertest) ou teste de integração do use case.
3. **Teste unitário da Specification** — regras de filtro isoladas.
4. **Implementação mínima** — use case + repositório Prisma.
5. **Controller fino** — só HTTP + DTO.

### Exemplo: listar pedidos do inbox

**Especificação (Gherkin):**

```gherkin
Feature: Inbox connection requests
  Scenario: List incoming friendship requests
    Given I am authenticated as user "neo"
    And there is a pending friendship request to "neo" from "sarah"
    When I GET /inbox/requests?type=friendship&direction=incoming
    Then the response contains 1 request
    And the request status is "pending"
```

**Specification (domínio):**

```typescript
// connections/domain/specifications/incoming-friendship.spec.ts
export class IncomingFriendshipRequestsSpec implements Specification<ConnectionRequest> {
  isSatisfiedBy(request: ConnectionRequest): boolean {
    return (
      request.type === ConnectionType.FRIENDSHIP &&
      request.status === RequestStatus.PENDING &&
      request.directionFor(this.recipientId) === 'incoming'
    );
  }
}
```

**Teste (especificação executável):**

```typescript
describe('IncomingFriendshipRequestsSpec', () => {
  it('accepts pending incoming friendship', () => { /* ... */ });
  it('rejects outgoing romance', () => { /* ... */ });
});
```

### Onde colocar testes

| Tipo | Pasta | Ferramenta |
|------|-------|------------|
| Unit (Specifications, VOs) | `src/**/domain/**/*.spec.ts` | Jest |
| Use case | `src/**/application/**/*.spec.ts` | Jest + mocks |
| HTTP/E2E | `test/**/*.e2e-spec.ts` | Jest + Supertest |
| Contrato (opcional) | `test/contract/` | Pact ou OpenAPI snapshot |

---

## 6. Passo a passo (implementação)

### Fase 0 — Pré-requisitos

- [ ] Node.js 20 LTS
- [ ] PostgreSQL local (Docker recomendado)
- [ ] Nest CLI: `npm i -g @nestjs/cli`
- [ ] Prisma CLI (vem com o projeto)

```bash
docker run --name paw-pg -e POSTGRES_PASSWORD=paw -e POSTGRES_DB=paw_connection \
  -p 5432:5432 -d postgres:16
```

---

### Passo 1 — Criar o projeto NestJS

Na raiz do repositório Paw Connection:

```bash
mkdir -p apps/api
cd apps/api
nest new . --package-manager npm --skip-git
```

Escolha **strict** TypeScript quando perguntado.

---

### Passo 2 — Instalar Prisma e configurar banco

```bash
cd apps/api
npm install prisma @prisma/client
npx prisma init
```

Edite `apps/api/.env`:

```env
DATABASE_URL="postgresql://postgres:paw@localhost:5432/paw_connection?schema=public"
JWT_SECRET="change-me-in-production"
JWT_EXPIRES_IN="7d"
PORT=3000
```

Adicione `apps/api/.env` ao `.gitignore` da raiz (se ainda não estiver).

---

### Passo 3 — Definir o schema Prisma

Copie o schema da [seção 7](#7-schema-prisma-alinhado-ao-código) para `apps/api/prisma/schema.prisma`.

```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

### Passo 4 — Estrutura DDD + tokens de injeção

Crie manualmente (ou via script):

```bash
mkdir -p src/shared/domain
mkdir -p src/shared/infrastructure/prisma
mkdir -p src/modules/profile/{domain,application,infrastructure,presentation}
# repetir para auth, connections, match, feed, media
```

Arquivos base:

1. `src/shared/domain/specification.ts` — interface `Specification<T>`
2. `src/shared/domain/result.ts` — `Result<T, E>` para erros de domínio
3. `src/shared/infrastructure/prisma/prisma.service.ts`
4. `src/shared/infrastructure/prisma/prisma.module.ts` — global

---

### Passo 5 — Specification base (shared)

```typescript
// src/shared/domain/specification.ts
export interface Specification<T> {
  isSatisfiedBy(candidate: T): boolean;
  and(other: Specification<T>): Specification<T>;
}

export abstract class CompositeSpecification<T> implements Specification<T> {
  abstract isSatisfiedBy(candidate: T): boolean;
  and(other: Specification<T>): Specification<T> {
    return new AndSpecification(this, other);
  }
}
```

Implemente `AndSpecification`, `OrSpecification` conforme necessidade (feed com múltiplos filtros).

---

### Passo 6 — Módulo Profile (primeiro vertical slice)

Ordem sugerida — espelha o fluxo mobile:

| # | Use case | Origem no app |
|---|----------|---------------|
| 1 | `GetMyProfileUseCase` | `ProfileScreen` / draft |
| 2 | `UpdateOwnerProfileUseCase` | campos owner do `ProfileDraft` |
| 3 | `UpdatePetProfileUseCase` | campos dog do `ProfileDraft` |
| 4 | `SetUserInterestsUseCase` | `interests.tsx` |
| 5 | `CompleteOnboardingUseCase` | `completeOnboarding()` |
| 6 | `GetPublicProfileByHandleUseCase` | `easy-qr.tsx` |

**SDD para Passo 6:**

1. Escreva `test/profile.e2e-spec.ts` com `GET /profile/me` retornando 401 sem token.
2. Implemente entidade `User` + `Pet` no domínio (sem Prisma no domain).
3. `PrismaUserRepository` implementa `IUserRepository`.
4. Controller `ProfileController` delega ao use case.

DTO de resposta deve permitir que o mobile substitua `ProfileDraft`:

```typescript
// exemplo de contrato
{
  onboardingComplete: boolean;
  interests: string[];
  owner: { fullName, email, phone, age, gender, location, bio, photoUrl };
  pet: { name, age, breed, bio, temperament, vaccinated, gender, photoUrl, ... };
  handle: string; // "@walkingphoebe" — pode incluir @ na API ou só no client
}
```

---

### Passo 7 — Módulo Media (upload antes de salvar perfil)

O app hoje guarda `file://` URIs locais. O backend precisa de URLs HTTP.

| # | Tarefa |
|---|--------|
| 1 | `POST /media/upload` — multipart, retorna `{ url }` |
| 2 | Validar mime type e tamanho |
| 3 | Armazenar em disco (dev) ou S3 (prod) |
| 4 | `UpdateOwnerProfile` / `UpdatePetProfile` recebem `photoUrl`, não arquivo |

Mobile (fase integração): após pick da galeria, upload → depois `PATCH` perfil com URL.

---

### Passo 8 — Módulo Auth

Hoje **não há login**. Introduza:

| Endpoint | Descrição |
|----------|-----------|
| `POST /auth/register` | email + senha + nome (início do onboarding) |
| `POST /auth/login` | JWT access token |
| `GET /auth/me` | usuário autenticado |

Use `@nestjs/passport` + `jwt`. Guarde `sub` = `userId` no token.

**Specification exemplo:** `UniqueEmailSpec` antes de registrar.

---

### Passo 9 — Módulo Connections (Inbox)

Mapeie `InboxRequest` → agregado `ConnectionRequest`:

| Campo mock | Campo Prisma |
|------------|--------------|
| `switchTab: romance \| friendship \| requests` | `type` + regras de listagem |
| `filter: incoming \| outgoing` | derivado de `senderId` / `recipientId` vs usuário logado |
| Confirm / Delete na UI | `POST .../accept`, `POST .../reject` |

Specifications úteis:

- `PendingRequestsForUserSpec`
- `RequestsByTypeSpec` (romance / friendship)
- `IncomingRequestsSpec` / `OutgoingRequestsSpec`

---

### Passo 10 — Módulo Match (Find)

| Ação UI | Use case |
|---------|----------|
| Ver candidatos | `ListMatchCandidatesUseCase` + specs de distância/interesse |
| Close | `PassMatchCandidateUseCase` |
| Wave / Hi | `SendWaveUseCase` → pode criar `ConnectionRequest` |

Specifications:

- `ExcludePassedUsersSpec`
- `WithinRadiusSpec` (usa `latitude`/`longitude` do `User`)
- `MatchingInterestSpec`

---

### Passo 11 — Módulo Feed

Alinhado a `FeedRadiusKm`, `FeedPostScope`, `new-post.tsx`:

| Endpoint | Detalhe |
|----------|---------|
| `GET /feed/posts` | query: `radiusKm`, `scope`, `search`, `city` |
| `POST /feed/posts` | body + até 8 `imageUrls` |
| `POST /feed/posts/:id/like` | toggle like |
| `GET /feed/posts/:id/comments` | listagem |
| `POST /feed/posts/:id/comments` | criar |

`ListFeedPostsUseCase` compõe specs:

```typescript
const spec = new PublishedPostsSpec()
  .and(new WithinRadiusSpec(userLat, userLng, radiusKm))
  .and(new PostScopeSpec(scope, userId));
```

---

### Passo 12 — Validação e erros (presentation)

- `class-validator` nos DTOs
- `ValidationPipe` global
- Filtro de exceção mapeando `DomainError` → HTTP 400/404/409

---

### Passo 13 — Documentação OpenAPI

```bash
npm install @nestjs/swagger swagger-ui-express
```

Configure em `main.ts`. A especificação OpenAPI vira contrato para o time mobile.

---

### Passo 14 — Seeds para desenvolvimento

`prisma/seed.ts` — usuários de exemplo espelhando mocks:

- Pluto / Jefferson (feed)
- Luna / Sarah (inbox romance)
- Dados compatíveis com `MOCK_INBOX_REQUESTS`

```bash
npx prisma db seed
```

---

### Passo 15 — Integração mobile (quando API estiver estável)

1. Criar `lib/api/client.ts` no Expo com `fetch` + base URL `EXPO_PUBLIC_API_URL`.
2. Criar `lib/api/profile.ts` — mapear JSON ↔ `ProfileDraft`.
3. Em `ProfileOnboardingProvider`:
   - hidratar do servidor se logado;
   - manter AsyncStorage como cache offline (opcional).
4. Substituir `MOCK_INBOX_REQUESTS` por `GET /inbox/requests`.
5. `new-post.tsx` — `POST /feed/posts` em vez do Alert.

Variável Expo (`app.config` ou `.env`):

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

---

### Passo 16 — CI

Pipeline mínimo para `apps/api`:

```yaml
# .github/workflows/api.yml (exemplo)
- npm ci
- npx prisma migrate deploy
- npm run test
- npm run test:e2e
- npm run build
```

---

## 7. Schema Prisma alinhado ao código

Salve em `apps/api/prisma/schema.prisma` e ajuste conforme evoluir o app.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Gender {
  Male
  Female
}

enum Temperament {
  Happy
  Calm
  Playful
  Energetic
  Shy
  Friendly
}

enum Vaccinated {
  Yes
  No
}

enum Interest {
  Friendship
  DogFriendlyLocations
  DogServices
  DogPlaydates
  AllTheAbove
}

enum ConnectionType {
  romance
  friendship
  request
}

enum RequestStatus {
  pending
  accepted
  rejected
}

model User {
  id                   String    @id @default(cuid())
  email                String?   @unique
  passwordHash         String?
  fullName             String
  handle               String    @unique
  age                  Int?
  gender               Gender    @default(Male)
  location             String?
  latitude             Float?
  longitude            Float?
  bio                  String?
  photoUrl             String?
  phone                String?
  onboardingComplete   Boolean   @default(false)
  verified             Boolean   @default(false)
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  interests            UserInterest[]
  pet                  Pet?
  sentRequests         ConnectionRequest[] @relation("SentRequests")
  receivedRequests     ConnectionRequest[] @relation("ReceivedRequests")
  posts                Post[]
  likes                PostLike[]
  comments             Comment[]
  matchPasses          MatchPass[] @relation("MatchPassUser")
  matchWavesSent       MatchWave[] @relation("WaveSender")
}

model UserInterest {
  userId    String
  interest  Interest
  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([userId, interest])
}

model Pet {
  id              String       @id @default(cuid())
  userId          String       @unique
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  name            String
  age             Int?
  breed           String?
  bio             String?
  photoUrl        String?
  temperament     Temperament  @default(Happy)
  vaccinated      Vaccinated   @default(Yes)
  gender          Gender       @default(Male)
  favoritesThings String?
  favoriteMeal    String?
  enjoysPark      Boolean      @default(true)
  enjoysWater     Boolean      @default(true)
  enjoysWalks     Boolean      @default(true)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}

model ConnectionRequest {
  id          String          @id @default(cuid())
  senderId    String
  recipientId String
  type        ConnectionType
  status      RequestStatus   @default(pending)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  sender      User @relation("SentRequests", fields: [senderId], references: [id])
  recipient   User @relation("ReceivedRequests", fields: [recipientId], references: [id])

  @@unique([senderId, recipientId, type])
}

model Post {
  id        String      @id @default(cuid())
  authorId  String
  body      String?
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  author    User        @relation(fields: [authorId], references: [id])
  images    PostImage[]
  likes     PostLike[]
  comments  Comment[]
}

model PostImage {
  id        String @id @default(cuid())
  postId    String
  url       String
  sortOrder Int

  post      Post   @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([postId, sortOrder])
}

model PostLike {
  userId    String
  postId    String
  createdAt DateTime @default(now())

  user      User @relation(fields: [userId], references: [id])
  post      Post @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@id([userId, postId])
}

model Comment {
  id        String   @id @default(cuid())
  postId    String
  authorId  String
  body      String
  createdAt DateTime @default(now())

  post      Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  author    User @relation(fields: [authorId], references: [id])
}

model MatchPass {
  userId    String
  targetId  String
  createdAt DateTime @default(now())

  user      User @relation("MatchPassUser", fields: [userId], references: [id])

  @@id([userId, targetId])
}

model MatchWave {
  id        String   @id @default(cuid())
  senderId  String
  targetId  String
  createdAt DateTime @default(now())

  sender    User @relation("WaveSender", fields: [senderId], references: [id])
}
```

### Mapeamento enum Interest ↔ app

| `InterestId` (mobile) | Prisma `Interest` |
|-----------------------|-------------------|
| Friendship | Friendship |
| Dog friendly locations | DogFriendlyLocations |
| Dog services | DogServices |
| Dog playdates | DogPlaydates |
| All the above | AllTheAbove |

Crie um mapper na camada de infraestrutura para não vazar Prisma no domínio.

---

## 8. Endpoints mapeados por tela

### Onboarding / Auth

| Tela mobile | Método | Rota |
|-------------|--------|------|
| `splash` / registro | POST | `/auth/register` |
| login (futuro) | POST | `/auth/login` |
| `interests` | PUT | `/profile/me/interests` |
| `setup-you` | PATCH | `/profile/me/owner` |
| `setup-dog` | PATCH | `/profile/me/pet` |
| fotos onboarding | POST | `/media/upload` → PATCH perfil |
| `easy-qr` | POST | `/profile/me/onboarding/complete` |
| `easy-qr` | GET | `/profile/public/:handle` |

### Profile tab

| Tela | Método | Rota |
|------|--------|------|
| `profile-screen` | GET | `/profile/me` |
| Save changes | PATCH | `/profile/me/owner` ou `/pet` |
| Foto pet/owner | POST + PATCH | `/media/upload`, depois PATCH |

### Inbox

| UI | Método | Rota |
|----|--------|------|
| Lista | GET | `/inbox/requests?type=&direction=` |
| Confirm | POST | `/inbox/requests/:id/accept` |
| Delete | POST | `/inbox/requests/:id/reject` |

### Match

| UI | Método | Rota |
|----|--------|------|
| Feed cartão | GET | `/match/candidates` |
| Close | POST | `/match/candidates/:userId/pass` |
| Wave | POST | `/match/candidates/:userId/wave` |

### Feed

| UI | Método | Rota |
|----|--------|------|
| Lista | GET | `/feed/posts?radiusKm=&scope=&q=` |
| `new-post` | POST | `/feed/posts` |
| Like | POST | `/feed/posts/:id/like` |
| Comentários | GET/POST | `/feed/posts/:id/comments` |

---

## 9. Integração com o app Expo

### Camada API sugerida no mobile

```text
lib/
  api/
    client.ts       # fetch wrapper, Authorization header
    auth.ts
    profile-mapper.ts  # ProfileDraft <-> API DTO
    inbox.ts
    feed.ts
    match.ts
```

### Mapper ProfileDraft (exemplo conceitual)

```typescript
export function profileMeToDraft(dto: ProfileMeResponse): ProfileDraft {
  return {
    interests: dto.interests.map(prismaInterestToApp),
    fullName: dto.owner.fullName,
    email: dto.owner.email ?? '',
    // ... demais campos
    dogPhotoUri: dto.pet.photoUrl,
    humanPhotoUri: dto.owner.photoUrl,
  };
}
```

### Ordem de migração recomendada

1. Auth + `GET/PATCH /profile/me`
2. Media upload
3. Onboarding complete + public handle
4. Feed posts
5. Inbox
6. Match

Mantenha `paw_profile_draft_v1` como fallback até a API estar estável.

---

## 10. Checklist de conclusão

### Infraestrutura

- [ ] `apps/api` NestJS rodando em `localhost:3000`
- [ ] PostgreSQL + Prisma migrate
- [ ] `.env` documentado (sem secrets no Git)

### Domínio & qualidade

- [ ] Módulos por bounded context
- [ ] Repositórios via interfaces (DIP)
- [ ] Specifications testadas para filtros complexos (feed, inbox, match)
- [ ] E2E cobrindo fluxo crítico: register → onboarding → GET profile/me

### Paridade com o app

- [ ] `ProfileDraft` serializável a partir da API
- [ ] Interesses e enums compatíveis
- [ ] Handle público igual à regra `publicHandleFromDraft`
- [ ] Upload substitui URIs `file://`
- [ ] Seeds refletem mocks de inbox/feed

### Mobile (fase 2)

- [ ] `EXPO_PUBLIC_API_URL` configurado
- [ ] `new-post` publica no backend
- [ ] Inbox usa API
- [ ] Remover ou isolar mocks em `constants/inbox-mocks.ts`

---

## Referências rápidas no repositório mobile

| Recurso | Caminho |
|---------|---------|
| Modelo de perfil | `context/profile-onboarding.tsx` |
| Chaves AsyncStorage | `paw_profile_draft_v1`, `paw_onboarding_complete_v1` |
| Mock inbox | `constants/inbox-mocks.ts` |
| Filtros feed | `constants/feed-discovery-filters.ts` |
| Publicação post | `app/new-post.tsx` |
| Handle público | `publicHandleFromDraft()` em `profile-onboarding.tsx` |

---

## Próximo passo sugerido

Comece pelo **vertical slice Profile + Auth** (Passos 6–8): é o que desbloqueia onboarding, tela de perfil e QR — tudo que já existe no app com `ProfileDraft` local.

Se quiser, na próxima iteração podemos gerar o scaffold inicial em `apps/api/` (módulos, Prisma schema e primeiro teste e2e) diretamente neste repositório.
