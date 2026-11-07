# Paw Connection

Aplicativo mobile de conexão social para donos de pets e seus cães, com backend NestJS e app mobile Expo/React Native.

## 📁 Estrutura do Monorepo

```
paw-connection/
├── apps/
│   ├── api/              # Backend NestJS + Prisma + PostgreSQL
│   └── app/              # App mobile Expo (React Native)
├── docs/                 # Documentação (ADRs, Play Store, etc.)
├── .cursor/              # Regras do Cursor IDE
├── docker-compose.yml    # Orquestração de serviços (Postgres, etc.)
└── README.md             # Este arquivo
```

## 🚀 Início Rápido

### Pré-requisitos

- **Node.js** 20+ (preferencialmente 20.19.4+)
- **Docker** e **Docker Compose** (para banco de dados)
- **npm** ou **yarn**
- Para desenvolvimento mobile: Android Studio / Xcode (opcional, pode usar Expo Go)

### 1. Clone e Instale Dependências

```bash
git clone <url-do-repo>
cd paw-connection

# Instalar dependências do backend
cd apps/api
npm install

# Instalar dependências do app
cd ../app
npm install

cd ../..
```

### 2. Configure Variáveis de Ambiente

Copie os arquivos `.env.example` para `.env` em cada projeto:

```bash
# Backend
cp apps/api/.env.example apps/api/.env

# Mobile
cp apps/app/.env.example apps/app/.env
```

**Edite os `.env` conforme necessário:**

- `apps/api/.env`: configure `DATABASE_URL`, `JWT_SECRET`, URLs do Supabase (se usado)
- `apps/app/.env`: configure `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `GOOGLE_MAPS_ANDROID_API_KEY`

> **Importante:** Nunca commite arquivos `.env` com credenciais reais. Use `.env.example` apenas com valores de exemplo.

### 3. Suba o Banco de Dados

Use Docker Compose para rodar o PostgreSQL:

```bash
docker compose up -d postgres
```

Isso irá criar um container PostgreSQL na porta `5432` com:
- Usuário: `postgres`
- Senha: `paw`
- Database: `paw_connection`

**Aguarde o healthcheck do container ficar "healthy"** antes de rodar migrations:

```bash
docker compose ps
```

### 4. Execute Migrations e Seed do Banco

Entre no diretório da API e rode:

```bash
cd apps/api
npx prisma migrate dev
npx prisma db seed
```

Isso criará as tabelas e populará o banco com usuários de exemplo:
- `neo@paw.test` / `password123`
- `sarah@paw.test` / `password123`
- `jefferson@paw.test` / `password123`

### 5. Inicie o Backend (API)

```bash
cd apps/api
npm run start:dev
```

A API estará rodando em: `http://localhost:3001`  
Swagger/Docs: `http://localhost:3001/docs`

### 6. Inicie o App Mobile (Expo)

Em outro terminal:

```bash
cd apps/app
npm start
```

Isso abre o Metro Bundler. Você pode:
- Escanear o QR Code com Expo Go (Android/iOS)
- Apertar `a` para abrir no emulador Android
- Apertar `i` para abrir no simulador iOS

> **Nota:** No `.env` do app, `EXPO_PUBLIC_USE_LAN_API=true` faz o app conectar ao IP da sua máquina de dev. Se estiver testando em dispositivo físico, certifique-se de estar na mesma rede.

## 🗂️ Estrutura dos Projetos

### Backend (`apps/api`)

Segue **Clean Architecture** + **DDD** + **TDD**:

```
apps/api/
├── src/
│   ├── main.ts                # Bootstrap da aplicação
│   ├── app.module.ts
│   ├── shared/                # Código compartilhado (Prisma, guards, etc.)
│   └── modules/               # Módulos de domínio (auth, profile, feed, inbox, chat, etc.)
│       ├── auth/
│       ├── profile/
│       ├── feed/
│       ├── inbox/
│       ├── match/
│       ├── chat/
│       └── media/
├── prisma/
│   ├── schema.prisma          # Schema do banco
│   ├── migrations/            # Histórico de migrations
│   └── seed.ts                # Dados iniciais
├── test/                      # Testes E2E
├── .env.example
└── README.md
```

**Camadas por módulo:**
- `domain/` — Entidades, Value Objects, Specifications
- `application/` — Use Cases
- `infrastructure/` — Repositórios Prisma, adaptadores externos
- `presentation/` — Controllers (HTTP), DTOs

### App Mobile (`apps/app`)

Expo Router com React Native:

```
apps/app/
├── app/                       # Rotas (Expo Router file-based)
│   ├── (tabs)/                # Tabs principais (feed, inbox, match, profile)
│   ├── auth/                  # Login/registro
│   ├── onboarding/            # Onboarding (interests, setup-you, setup-dog, etc.)
│   └── chat/
├── components/
│   ├── paw/                   # Design system (botões, inputs, etc.)
│   └── screens/               # Telas específicas
├── context/                   # Providers React (auth, profile, etc.)
├── hooks/                     # Custom hooks
├── lib/
│   ├── api/                   # Cliente HTTP e mappers
│   └── navigation/            # Helpers de navegação
├── constants/                 # Constantes, mocks, estilos
├── .env.example
└── README.md
```

## 🧪 Testes

### Backend

```bash
cd apps/api

# Testes unitários
npm test

# Testes E2E
npm run test:e2e

# Coverage
npm run test:cov
```

### App Mobile

```bash
cd apps/app
npm test
```

> Testes de unidade/integração no app são limitados; foco está em testes manuais via Expo Go/builds.

## 🐳 Docker

O `docker-compose.yml` na raiz fornece:

- **postgres**: PostgreSQL 16 na porta `5432`
- *(Opcional)* Supabase self-hosted (comentado por padrão; veja instruções no arquivo)
- *(Opcional)* Container da API (comentado; prefira rodar localmente via `npm run start:dev`)

Para produção, veja `apps/api/docker-compose.prod.yml` (exemplo de deploy).

## 📦 Supabase

O projeto usa **Supabase Storage** para upload de mídia (fotos de perfil, posts).

**Opções:**

1. **Supabase Cloud** (mais fácil):
   - Crie um projeto em [supabase.com](https://supabase.com)
   - Copie as chaves (anon key, service role key) e URL para os `.env`
   - Crie um bucket `paw-media` em Storage (público ou autenticado conforme necessidade)

2. **Supabase Self-hosted** (local):
   - Clone o [repositório oficial do Supabase](https://github.com/supabase/supabase) e rode o `docker-compose` deles
   - Ou descomente a seção do Supabase em `docker-compose.yml` (exemplo simplificado)
   - Configure `SUPABASE_URL=http://localhost:8000` e as chaves no `.env`

3. **Sem Supabase** (fallback local):
   - Se `SUPABASE_URL` não estiver configurado ou falhar, a API salva uploads em `apps/api/uploads/` (disco local)
   - Funciona para dev, mas não é recomendado para produção

## 📚 Documentação Adicional

- **Backend:** `apps/api/README.md`
- **App Mobile:** `apps/app/README.md`
- **ADRs (Architectural Decision Records):** `docs/adr/`
- **Guia de desenvolvimento backend (DDD/TDD):** `backend-nestjs-passo-a-passo.md`
- **Regras do projeto:** `.cursor/rules/` (convenções Git, testes, arquitetura, etc.)

## 🔐 Segurança

- **Nunca commite** arquivos `.env`, `play-service-account.json`, keystores, ou qualquer credencial
- Em produção, use `JWT_SECRET` forte, HTTPS, rate limiting (já configurado via `@nestjs/throttler`)
- Valide todas as entradas de usuário (DTOs + `class-validator`)
- Configure CORS adequadamente em `apps/api/src/main.ts` (variável `CORS_ORIGINS`)

## 🛠️ Scripts Úteis

### Backend

```bash
cd apps/api

npm run start:dev          # Desenvolvimento com hot-reload
npm run build              # Build para produção
npm run start:prod         # Rodar build de produção
npx prisma studio          # Abrir UI do Prisma para visualizar banco
npx prisma migrate dev     # Criar nova migration
npx prisma db seed         # Popular banco com dados de seed
npm run lint               # Lint do código
npm test                   # Testes unitários
npm run test:e2e           # Testes E2E
```

### App Mobile

```bash
cd apps/app

npm start                  # Inicia Metro Bundler (Expo)
npm run android            # Build dev Android local
npm run ios                # Build dev iOS local
npm run lint               # Lint do código
npm test                   # Testes unitários
npm run build:apk:preview  # Build APK via EAS (preview)
```

## 🔄 Git Flow

O projeto segue **Git Flow** com commit messages em **Conventional Commits**:

- `main` — produção (não commitar diretamente)
- `develop` — integração (features são mergeadas aqui)
- `feature/<id>-<desc>` — novas funcionalidades
- `bugfix/<id>-<desc>` — correções de bugs
- `hotfix/<date>-<desc>` — correções urgentes em produção

**Formato de commit:**
```
type(scope): descrição [Refs #ID]
```

Exemplos:
```
feat(api): add feed post creation endpoint [Refs #42]
fix(app): resolve inbox tab navigation bug
refactor(chat): extract message component
```

Veja `.cursor/rules/09-git-flow.mdc` para detalhes completos.

## 📋 Status do Projeto / Onde Parei

### ✅ Implementado

- **Backend:**
  - Módulos: Auth, Profile, Inbox (connection requests), Match, Feed, Chat (WebSocket), Media
  - Prisma schema completo com User, Pet, Post, Comment, ConnectionRequest, Message, etc.
  - JWT authentication
  - Supabase Storage + fallback local
  - Swagger docs
  - WebSocket chat em tempo real
  - Seeds com usuários de exemplo

- **App Mobile:**
  - Onboarding completo (interests, setup-you, setup-dog, easy-qr)
  - Tabs: Feed, Inbox, Match, Profile
  - Chat one-to-one com WebSocket
  - Upload de fotos (perfil, posts)
  - Integração com Google Maps (pins de locais dog-friendly)
  - Navigation stack com deep linking
  - Design system básico (`components/paw`)

### 🚧 Em Progresso / Próximos Passos

- **Backend:**
  - Notificações push (Firebase Cloud Messaging)
  - Moderação de conteúdo (relatórios de posts/comentários)
  - Busca avançada de usuários/posts
  - Analytics/métricas

- **App Mobile:**
  - Melhorar UX de loading/erros
  - Adicionar testes E2E (Detox ou Maestro)
  - Offline-first para chat (cache local)
  - Publicação na Google Play Store (em alpha internal testing)

### 🐛 Issues Conhecidos

- Seed `neo@paw.test` usa email de placeholder; ajustar para dados mais realistas se necessário
- WebSocket desconecta se API reiniciar; falta reconnect automático no client
- Emulador Android: imagens do Supabase às vezes não carregam por proxy; usar `EXPO_PUBLIC_API_URL` apontando para IP da rede local

### 📝 Notas para Novo Desenvolvedor

1. **Leia primeiro:** `apps/api/README.md`, `apps/app/README.md`, e `.cursor/rules/` (especialmente `01-engineering-constitution.mdc`)
2. **Ambiente:** Certifique-se de ter Docker, Node 20+, e (opcionalmente) Android Studio configurado
3. **Secrets:** Peça ao time as chaves reais de produção (Supabase, Google Maps, etc.) — nunca estão no Git
4. **DB Dumps:** Se houver um dump SQL em `backups/`, pode restaurá-lo com:
   ```bash
   docker compose exec postgres psql -U postgres -d paw_connection < backups/dump.sql
   ```
5. **Qualquer dúvida:** Consulte `backend-nestjs-passo-a-passo.md` (guia completo de como o backend foi arquitetado)

## 📞 Contato

Para dúvidas, consulte a documentação interna ou abra uma issue no repositório (se privado, entre em contato com o maintainer do projeto).

---

**Boa sorte e bom desenvolvimento! 🐾**
