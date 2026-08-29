#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# shellcheck source=/dev/null
source "$ROOT/scripts/setup-android-env.sh"

# Production bundle env (never embed localhost from .env dev)
export NODE_ENV=production
export CI=1
set -a
# shellcheck source=/dev/null
source "$ROOT/.env.production"
set +a
export EXPO_PUBLIC_USE_LAN_API=false
export EXPO_PUBLIC_USE_REMOTE_API=true

echo "JAVA_HOME=$JAVA_HOME"
echo "ANDROID_HOME=$ANDROID_HOME"
echo "NODE_ENV=$NODE_ENV"
echo "API=$EXPO_PUBLIC_API_URL"
java -version

if [ -z "${GOOGLE_MAPS_ANDROID_API_KEY:-}" ]; then
  echo ""
  echo "ERRO: GOOGLE_MAPS_ANDROID_API_KEY não definida."
  echo "Adicione em .env.production (build local) ou exporte antes do build."
  echo "Veja .env.example — Maps SDK for Android + package com.plima1212.pawconnection"
  exit 1
fi

if [ ! -d "$ANDROID_HOME/platform-tools" ]; then
  echo "Android SDK incompleto. Rode: bash scripts/setup-android-sdk.sh"
  exit 1
fi

echo "Atualizando projeto nativo Android (expo prebuild)..."
npx expo prebuild --platform android

bash "$ROOT/scripts/patch-android-gradle.sh" "$ROOT/android/app/build.gradle"

echo "Compilando APK release (bundle JS embutido, sem depender do Metro)..."
cd android
./gradlew assembleRelease --no-daemon

APK="$ROOT/android/app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK" ]; then
  cp -f "$APK" "$ROOT/paw-connection-test.apk"
  echo ""
  echo "APK gerado:"
  echo "  $APK"
  echo "  $ROOT/paw-connection-test.apk"
else
  echo "APK não encontrado em $APK"
  exit 1
fi
