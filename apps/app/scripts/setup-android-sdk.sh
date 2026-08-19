#!/usr/bin/env bash
# Instala Android SDK em ~/Android/Sdk (sem sudo). JDK 17 deve estar instalado no sistema.
set -euo pipefail

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
mkdir -p "$ANDROID_HOME/cmdline-tools"

if [ ! -f "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" ]; then
  echo "Baixando Android command-line tools..."
  TMP="$(mktemp -d)"
  wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O "$TMP/cmdline-tools.zip"
  unzip -q "$TMP/cmdline-tools.zip" -d "$ANDROID_HOME/cmdline-tools"
  mv "$ANDROID_HOME/cmdline-tools/cmdline-tools" "$ANDROID_HOME/cmdline-tools/latest"
  rm -rf "$TMP"
fi

export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
yes | sdkmanager --licenses >/dev/null
sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0" "ndk;27.1.12297006"

echo "SDK instalado em $ANDROID_HOME"
