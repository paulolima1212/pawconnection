# Paw Connection — App Mobile

Aplicativo mobile de conexão social para donos de pets e seus cães, construído com **Expo** e **React Native**.

## 📱 Sobre o App

O Paw Connection permite que donos de cães:
- Conheçam outros donos e pets próximos (feed social)
- Gerenciem pedidos de conexão (inbox: amizade, romance)
- Descubram candidatos para match (estilo swipe)
- Conversem via chat em tempo real (WebSocket)
- Encontrem locais dog-friendly no mapa (Google Places)
- Personalizem perfil de dono + pet
- Publiquem fotos e interajam com posts de outros usuários

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 20+ (preferencialmente 20.19.4+)
- npm ou yarn
- Expo CLI (instalado globalmente ou via `npx`)
- (Opcional) Android Studio / Xcode para builds locais
- Dispositivo físico ou emulador para testes

### Instalação

```bash
cd apps/app
npm install
```

### Configuração

Copie `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

**Variáveis principais:**

```env
# Conectar ao backend local via LAN (Expo Go em dispositivo físico)
EXPO_PUBLIC_USE_LAN_API=true
EXPO_PUBLIC_API_URL=http://localhost:3001

# URL do app (deep linking, OAuth callbacks)
EXPO_PUBLIC_APP_URL=http://localhost:8081

# Supabase (para storage de mídia)
EXPO_PUBLIC_SUPABASE_URL=http://localhost:8000
EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET=paw-media

# Google Maps (obrigatório para mapa de pins)
GOOGLE_MAPS_ANDROID_API_KEY=<sua-chave-aqui>
```

> **Importante:** Nunca commite `.env` com chaves reais. Use apenas `.env.example` com placeholders.

### Rodar o App

```bash
npm start
```

Isso abrirá o Metro Bundler. Você pode:

- **Expo Go (mais fácil):** Escaneie o QR code no terminal com o app Expo Go (Android/iOS)
- **Emulador Android:** Aperte `a` no terminal
- **Simulador iOS:** Aperte `i` no terminal (somente macOS)
- **Web:** Aperte `w` (funcionalidade limitada)

### Conectar ao Backend

Certifique-se de que o backend (`apps/api`) esteja rodando:

```bash
cd apps/api
npm run start:dev
```

- **Expo Go em dispositivo físico:** O app detecta automaticamente o IP da sua máquina se `EXPO_PUBLIC_USE_LAN_API=true`. Dispositivo e dev machine devem estar na mesma rede Wi-Fi.
- **Emulador Android:** `localhost` é convertido para `10.0.2.2` automaticamente.
- **Produção:** Defina `EXPO_PUBLIC_USE_REMOTE_API=true` e aponte `EXPO_PUBLIC_API_URL` para a URL remota.

## 🗂️ Estrutura do Código

```
apps/app/
├── app/                       # Rotas (Expo Router file-based)
│   ├── (tabs)/                # Navegação bottom tabs
│   │   ├── feed.tsx           # Feed social
│   │   ├── inbox.tsx          # Pedidos de conexão
│   │   ├── match.tsx          # Descobrir candidatos
│   │   └── profile.tsx        # Perfil do usuário
│   ├── auth/                  # Login/registro (futuro)
│   ├── onboarding/            # Fluxo de onboarding
│   │   ├── interests.tsx
│   │   ├── setup-you.tsx
│   │   ├── setup-dog.tsx
│   │   └── easy-qr.tsx
│   ├── chat/                  # Chat one-to-one
│   ├── new-post.tsx           # Criar novo post
│   ├── post-detail/[id].tsx   # Detalhes de post + comentários
│   └── _layout.tsx            # Layout raiz
├── components/
│   ├── paw/                   # Design system (Button, Input, Avatar, etc.)
│   └── screens/               # Componentes de tela específicos
├── context/                   # React Context Providers
│   ├── auth-context.tsx
│   ├── profile-onboarding.tsx
│   ├── inbox-provider.tsx
│   └── chat-socket-context.tsx
├── hooks/                     # Custom hooks
│   ├── use-feed-nearby-cities.ts
│   └── use-keyboard-aware-bottom-padding.ts
├── lib/
│   ├── api/                   # Cliente HTTP e config
│   │   ├── config.ts          # Resolução de URLs (dev/prod)
│   │   └── client.ts          # Fetch wrapper (futuro)
│   └── navigation/            # Helpers de navegação
│       └── open-chat.ts
├── constants/
│   ├── paw-styles.ts          # Cores, fontes, espaçamentos
│   ├── inbox-mocks.ts         # Mocks (a serem removidos após integração completa)
│   └── feed-discovery-filters.ts
├── assets/                    # Imagens, ícones, Lottie animations
├── .env.example
├── app.json                   # Configuração Expo
├── eas.json                   # Configuração EAS Build
└── package.json
```

## 🧩 Principais Funcionalidades

### Onboarding

1. **Interesses** (`app/onboarding/interests.tsx`): Escolher interesses (amizade, playdates, etc.)
2. **Setup You** (`app/onboarding/setup-you.tsx`): Dados do dono (nome, idade, bio, foto)
3. **Setup Dog** (`app/onboarding/setup-dog.tsx`): Dados do pet (nome, raça, temperamento, foto)
4. **Easy QR** (`app/onboarding/easy-qr.tsx`): Gerar handle único (@nomedodog) e QR code

Estado armazenado em `ProfileOnboardingProvider` (`context/profile-onboarding.tsx`), salvo em `AsyncStorage` como `paw_profile_draft_v1`.

### Tabs Principais

- **Feed** (`app/(tabs)/feed.tsx`): Posts de usuários próximos, filtros por raio/city/scope (public/friends)
- **Inbox** (`app/(tabs)/inbox.tsx`): Pedidos de amizade/romance (incoming/outgoing)
- **Match** (`app/(tabs)/match.tsx`): Swipe-style discovery de candidatos
- **Profile** (`app/(tabs)/profile.tsx`): Editar perfil do dono e do pet

### Chat

- **WebSocket** via `ChatSocketProvider` (`context/chat-socket-context.tsx`)
- Mensagens em tempo real, indicadores de "typing", leitura
- Rotas: `app/chat/[conversationId].tsx`

### Mapa de Pins

- Integração com **Google Places API (New)** para buscar locais dog-friendly
- Exibido em `app/(tabs)/feed.tsx` (mapa com pins + lista)
- Configurar `GOOGLE_MAPS_ANDROID_API_KEY` no `.env`

## 🎨 Design System

Componentes reutilizáveis em `components/paw/`:

- `PawButton.tsx` — Botões primários, secundários, outline
- `PawTextInput.tsx` — Input de texto com label/erro
- `PawAvatar.tsx` — Avatar de usuário/pet
- `PawCard.tsx` — Cards para posts, profiles
- `KeyboardAwareFormScroll.tsx` — Wrapper para telas com input (scroll + teclado)

**Cores/Estilos:** `constants/paw-styles.ts` (paleta de cores, fontes, espaçamentos)

## 🧪 Testes

```bash
npm test
```

Testes unitários para `lib/*.spec.ts`, `constants/*.spec.ts`, etc.

> **Nota:** Testes E2E ainda não estão configurados. Recomendamos testes manuais via Expo Go ou builds de desenvolvimento.

## 📦 Builds

### Build de Desenvolvimento (APK local)

```bash
npm run build:apk:local
```

Gera um APK para testes em dispositivos Android sem EAS.

### Build via EAS (Cloud)

```bash
# Preview (APK para testes internos)
npm run build:apk:preview

# Production (AAB para Play Store)
npm run build:aab:production
```

**Configuração:** `eas.json` (já configurado para profiles `preview`, `production`)

### Publicar na Play Store

```bash
# Submeter para alpha internal testing
npm run submit:android:alpha
```

## 🔑 Variáveis de Ambiente

Todas as variáveis devem começar com `EXPO_PUBLIC_` para serem acessíveis no código:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `EXPO_PUBLIC_API_URL` | URL da API backend | `http://localhost:3001` |
| `EXPO_PUBLIC_USE_LAN_API` | Conectar via LAN em dev | `true` |
| `EXPO_PUBLIC_USE_REMOTE_API` | Forçar URL remota | `false` |
| `EXPO_PUBLIC_LAN_API_PORT` | Porta da API local | `3001` |
| `EXPO_PUBLIC_APP_URL` | URL do app (deep links) | `http://localhost:8081` |
| `EXPO_PUBLIC_SUPABASE_URL` | URL do Supabase | `http://localhost:8000` |
| `EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET` | Bucket de storage | `paw-media` |
| `GOOGLE_MAPS_ANDROID_API_KEY` | Chave do Google Maps | `AIza...` |

## 🐛 Troubleshooting

### App não conecta ao backend local

- Certifique-se de que backend está rodando: `cd apps/api && npm run start:dev`
- Dispositivo físico: Esteja na mesma rede Wi-Fi que a máquina de dev
- Emulador Android: Use `10.0.2.2` em vez de `localhost` (conversão automática)
- Verifique `EXPO_PUBLIC_USE_LAN_API=true` no `.env`

### Imagens do Supabase não carregam

- Verifique `EXPO_PUBLIC_SUPABASE_URL` no `.env`
- Em emulador, pode ser necessário usar IP da rede em vez de `localhost`
- Backend tem fallback local (`uploads/`) se Supabase falhar

### Metro Bundler não abre automaticamente

- Abra manualmente: `npx expo start`
- Limpe cache: `npx expo start --clear`

### Erro de build Android

- Verifique `GOOGLE_MAPS_ANDROID_API_KEY` configurado
- SHA-1 fingerprint: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey` (senha: `android`)
- Restrinja a chave no Google Console ao package `com.plima1212.pawconnection`

## 📚 Documentação Adicional

- **Backend:** `apps/api/README.md`
- **Monorepo:** `README.md` (raiz do projeto)
- **Regras do projeto:** `.cursor/rules/` (convenções, arquitetura, git flow)
- **Guia de build local:** `docs/build-apk-local.md`

## 🔒 Segurança

- Nunca commite `.env` com chaves reais
- Use `.env.example` apenas com placeholders
- Keystore de produção (`paw-production.keystore`) não está no Git — deve ser armazenada de forma segura
- Credenciais do Google Play (`play-service-account.json`) também não estão no Git

## 📝 Status do Projeto

### ✅ Implementado

- Onboarding completo (interests, setup-you, setup-dog, easy-qr)
- Tabs principais (Feed, Inbox, Match, Profile)
- Chat WebSocket em tempo real
- Upload de fotos (perfil, posts) via Supabase/fallback local
- Mapa de pins dog-friendly (Google Places)
- Deep linking (`pawconnection://`)
- Design system básico

### 🚧 Próximos Passos

- Integração completa com API (substituir mocks)
- Login/registro de usuários
- Notificações push (Firebase Cloud Messaging)
- Melhorar UX de loading/erros
- Testes E2E (Detox ou Maestro)
- Publicação pública na Play Store

### 🐛 Issues Conhecidos

- Alguns mocks ainda estão em uso (`constants/inbox-mocks.ts`) — serão removidos após integração com API
- WebSocket desconecta se backend reiniciar; falta reconnect automático
- Emulador Android: imagens de storage às vezes não carregam via proxy

---

**Desenvolvido com ❤️ e 🐾**
