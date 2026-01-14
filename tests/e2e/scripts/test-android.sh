#!/bin/bash

set -e

OUTPUT_DIR="/tmp/e2e-output"
mkdir -p "$OUTPUT_DIR"

APK_PATH="packages/app/android/app/build/outputs/apk/debug/app-debug.apk"

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
bun dev > "$OUTPUT_DIR/metro.log" 2>&1 &
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

# Pre-warm Metro by requesting the bundle (this triggers compilation)
echo "Pre-warming Metro bundle..."
curl -sf "http://localhost:8081/index.bundle?platform=android&dev=true&minify=false" > /dev/null 2>&1 &
BUNDLE_PID=$!

# Wait for bundle to compile (check Metro logs for completion)
echo "Waiting for bundle compilation..."
for i in {1..120}; do
  if grep -q "Done in" "$OUTPUT_DIR/metro.log" 2>/dev/null || grep -q "BUNDLE.*100.0%" "$OUTPUT_DIR/metro.log" 2>/dev/null; then
    echo "Bundle compilation complete!"
    break
  fi
  sleep 2
  if [ $i -eq 120 ]; then
    echo "Warning: Bundle compilation taking longer than expected"
    echo "Last 20 lines of Metro log:"
    tail -20 "$OUTPUT_DIR/metro.log"
  fi
done

# Kill the background curl if still running
kill $BUNDLE_PID 2>/dev/null || true

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
# Run each flow in subdirectories (Maestro doesn't recurse by default)
maestro test \
  tests/e2e/flows/five_points/basic_game.yaml \
  --config tests/e2e/.maestro/config.yml \
  --env PLATFORM=android \
  --format junit \
  --output "$OUTPUT_DIR/e2e-results.xml" \
  --test-output-dir "$OUTPUT_DIR"

# Copy the tee'd metro log (contains client logs) to output
if [ -f /tmp/spicy-metro.log ]; then
  cp /tmp/spicy-metro.log "$OUTPUT_DIR/spicy-metro-client.log"
fi

# Capture logcat for crash debugging
echo "Capturing logcat..."
adb logcat -d > "$OUTPUT_DIR/logcat.log" 2>&1 || true

echo "Listing Output Directory"
ls -la "$OUTPUT_DIR"
