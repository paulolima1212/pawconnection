# Build APK local (Ubuntu)

## O que precisa estar instalado

| Componente | Status nesta máquina |
|------------|----------------------|
| OpenJDK 17 | `sudo apt install openjdk-17-jdk` |
| Android SDK (`~/Android/Sdk`) | `bash scripts/setup-android-sdk.sh` |
| Node ≥ 20.19.4 | `nvm install` (ver `.nvmrc`) |

## Variáveis de ambiente (adicione ao `~/.bashrc`)

```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/35.0.0:$PATH
```

Depois: `source ~/.bashrc`

## Gerar APK de teste (URLs externas)

```bash
cd apps/app
source scripts/setup-android-env.sh   # API remota + PATH
npm run build:apk:local
```

Saída: `paw-connection-test.apk` na raiz do app (cópia de `android/app/build/outputs/apk/debug/app-debug.apk`).

## Instalação do zero (outra máquina Ubuntu)

```bash
# 1. JDK (requer sudo)
sudo apt update
sudo apt install -y openjdk-17-jdk wget unzip zip

# 2. Node via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.nvm/nvm.sh
cd apps/app && nvm install

# 3. Android SDK (sem sudo)
bash scripts/setup-android-sdk.sh

# 4. Build
npm ci
npm run build:apk:local
```

## Permissões sudo usadas

- `apt-get install openjdk-17-jdk wget unzip zip`

Nenhuma outra permissão especial foi necessária; o SDK fica em `~/Android/Sdk`.
