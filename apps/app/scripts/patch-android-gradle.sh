#!/usr/bin/env bash
# Patches Android gradle files after expo prebuild for standalone APK installs.
set -euo pipefail

GRADLE_FILE="${1:?usage: patch-android-gradle.sh path/to/android/app/build.gradle}"
GRADLE_PROPS="${2:-$(dirname "$GRADLE_FILE")/../gradle.properties}"

if ! grep -q 'debuggableVariants = \[\]' "$GRADLE_FILE"; then
  python3 - "$GRADLE_FILE" <<'PY'
import sys
from pathlib import Path

path = Path(sys.argv[1])
text = path.read_text()
needle = "react {"
insert = "react {\n    debuggableVariants = []"
if needle not in text:
    raise SystemExit(f"Could not find {needle!r} in {path}")
path.write_text(text.replace(needle, insert, 1))
print(f"Patched {path} -> debuggableVariants = []")
PY
else
  echo "build.gradle already patched (debuggableVariants = [])"
fi

if [ -f "$GRADLE_PROPS" ]; then
  if grep -q '^android.enablePngCrunchInReleaseBuilds=' "$GRADLE_PROPS"; then
    sed -i 's/^android.enablePngCrunchInReleaseBuilds=.*/android.enablePngCrunchInReleaseBuilds=false/' "$GRADLE_PROPS"
  else
    echo 'android.enablePngCrunchInReleaseBuilds=false' >> "$GRADLE_PROPS"
  fi
  echo "Patched $GRADLE_PROPS -> android.enablePngCrunchInReleaseBuilds=false"
fi
