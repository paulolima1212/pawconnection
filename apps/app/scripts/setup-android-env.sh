#!/usr/bin/env bash
# Carrega variáveis para build Android local (source este arquivo).
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "$HOME/.nvm/nvm.sh"
  nvm use 20.19.4 >/dev/null 2>&1 || true
fi
export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-17-openjdk-amd64}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/35.0.0:$PATH"

# URLs externas (teste / produção)
export EXPO_PUBLIC_APP_URL="${EXPO_PUBLIC_APP_URL:-https://paw-app.lz-plima1212.online}"
export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-https://paw-backend.lz-plima1212.online}"
export EXPO_PUBLIC_SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL:-https://supabase.lz-plima1212.online}"
export EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET="${EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET:-paw-media}"
export EXPO_PUBLIC_USE_REMOTE_API="${EXPO_PUBLIC_USE_REMOTE_API:-true}"
