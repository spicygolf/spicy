#!/bin/bash

set -e

OUTPUT_DIR="/tmp/e2e-output"
mkdir -p "$OUTPUT_DIR"

APK_PATH="packages/app/android/app/build/outputs/apk/debug/app-debug.apk"

# Load environment variables (platform-specific passphrases)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/../.env" ]; then
  source "$SCRIPT_DIR/../.env"
fi

# Use Android-specific passphrase
TEST_PASSPHRASE="${TEST_PASSPHRASE_ANDROID:-$TEST_PASSPHRASE}"
if [ -z "$TEST_PASSPHRASE" ]; then
  echo "Error: TEST_PASSPHRASE_ANDROID not set. Please set it in tests/e2e/.env"
  exit 1
fi

# Cleanup function to kill Metro on exit
cleanup() {
  echo "Cleaning up..."
  if [ -n "$METRO_PID" ] && kill -0 "$METRO_PID" 2>/dev/null; then
    echo "Stopping Metro (PID: $METRO_PID)"
    kill "$METRO_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# Verify APK exists
if [ ! -f "$APK_PATH" ]; then
  echo "Error: APK not found at $APK_PATH"
  echo "Please run build-android.sh first"
  exit 1
fi

# Start Metro with client logs (bun dev tees to /tmp/spicy-metro.log)
echo "Starting Metro Bundler..."
cd packages/app
bun dev &
METRO_PID=$!
cd ../..

# Wait for Metro to start
echo "Waiting for Metro to start..."
for i in {1..30}; do
  if curl -sf http://localhost:8081/status > /dev/null 2>&1; then
    echo "Metro server is up!"
    break
  fi
  sleep 1
done

# Wait for bundle to be compiled (status responds before bundle is ready)
echo "Waiting for Android bundle to be ready..."
for i in {1..120}; do
  if curl -sf "http://localhost:8081/index.bundle?platform=android&dev=true&minify=false" > /dev/null 2>&1; then
    echo "Bundle is ready!"
    break
  fi
  if [ $i -eq 120 ]; then
    echo "Warning: Bundle may not be ready after 120s, continuing anyway..."
  fi
  sleep 1
done

# Set up port forwarding so emulator can reach Metro on host
echo "Setting up adb reverse for Metro..."
adb reverse tcp:8081 tcp:8081

# Install APK to emulator (Maestro will launch it)
echo "Installing app to Android Emulator..."
adb install -r "$APK_PATH"

# Run E2E tests
export PATH="$PATH":"$HOME/.maestro/bin"
export MAESTRO_DRIVER_STARTUP_TIMEOUT=300000
export MAESTRO_CLI_NO_ANALYTICS=1
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

echo "Running End-to-End tests on Android..."
maestro test \
  tests/e2e/flows/five_points/game_0/main.yaml \
  --config tests/e2e/.maestro/config.yml \
  --env PLATFORM=android \
  --env TEST_PASSPHRASE="$TEST_PASSPHRASE" \
  --format junit \
  --output "$OUTPUT_DIR/e2e-results.xml" \
  --test-output-dir "$OUTPUT_DIR"

# Copy metro log to output directory for artifact upload
cp /tmp/spicy-metro.log "$OUTPUT_DIR/metro.log" 2>/dev/null || true

# Capture logcat for crash debugging
echo "Capturing logcat..."
adb logcat -d > "$OUTPUT_DIR/logcat.log" 2>&1 || true

echo "Listing Output Directory"
ls -la "$OUTPUT_DIR"
