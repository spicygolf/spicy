#!/bin/bash

set -e

OUTPUT_DIR="/tmp/e2e-output"
mkdir -p "$OUTPUT_DIR"

echo "Building Android app..."
echo "Build logs will be written to 'android-build.log' in uploaded artifacts"

cd packages/app/android

# Build debug APK (faster, no Hermes bytecode compilation needed)
# --active-arch-only not available via gradle directly, so we use assembleDebug
./gradlew assembleDebug \
  -PreactNativeArchitectures=x86_64 \
  > "$OUTPUT_DIR/android-build.log" 2>&1 || {
    echo "=== Android build failed! Last 100 lines of log: ==="
    tail -100 "$OUTPUT_DIR/android-build.log"
    echo "=== End of log ==="
    exit 1
  }

echo "Android build complete!"
echo "APK location: packages/app/android/app/build/outputs/apk/debug/app-debug.apk"
