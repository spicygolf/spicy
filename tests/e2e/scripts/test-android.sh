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

# Start Metro
echo "Starting Metro Bundler..."
cd packages/app
bun start > "$OUTPUT_DIR/metro.log" 2>&1 &
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

# Install APK to emulator
echo "Installing app to Android Emulator..."
adb install -r "$APK_PATH"

# Launch the app
echo "Launching app..."
adb shell monkey -p golf.spicy -c android.intent.category.LAUNCHER 1

# Wait for app to start and connect to Metro
echo "Waiting for app to start..."
sleep 5

# Check Metro logs for app connection
echo "Checking Metro logs for app connection..."
tail -20 "$OUTPUT_DIR/metro.log"

# Check if Metro is still running
echo "Checking Metro status..."
curl -f http://localhost:8081/status || echo "Metro not responding"

# Check if app is installed
echo "Checking if app is installed..."
adb shell pm list packages | grep golf.spicy || echo "App not found"

# Give more time for app to fully initialize
sleep 10

# Run E2E tests
export PATH="$PATH":"$HOME/.maestro/bin"
export MAESTRO_DRIVER_STARTUP_TIMEOUT=300000
export MAESTRO_CLI_NO_ANALYTICS=1
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

echo "Running End-to-End tests on Android..."
# Run each flow in subdirectories (Maestro doesn't recurse by default)
maestro test \
  tests/e2e/flows/five_points/basic_game.yaml \
  --env PLATFORM=android \
  --format junit \
  --output "$OUTPUT_DIR/e2e-results.xml"

echo "Listing Output Directory"
ls -la "$OUTPUT_DIR"
