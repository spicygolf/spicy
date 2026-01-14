#!/bin/bash

set -e

OUTPUT_DIR="/tmp/e2e-output"
mkdir -p "$OUTPUT_DIR"

DERIVED_DATA_PATH="$HOME/Library/Developer/Xcode/DerivedData/SpicyGolf-e2e"
APP_PATH="$DERIVED_DATA_PATH/Build/Products/Debug-iphonesimulator/spicygolf.app"

# Cleanup function to kill Metro on exit
cleanup() {
  echo "Cleaning up..."
  if [ -n "$METRO_PID" ] && kill -0 "$METRO_PID" 2>/dev/null; then
    echo "Stopping Metro (PID: $METRO_PID)"
    kill "$METRO_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# Verify app exists
if [ ! -d "$APP_PATH" ]; then
  echo "Error: App not found at $APP_PATH"
  echo "Please run build-ios.sh first"
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
curl -sf "http://localhost:8081/index.bundle?platform=ios&dev=true&minify=false" > /dev/null 2>&1 &
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

# Install app to simulator
echo "Installing app to iOS Simulator..."
xcrun simctl install booted "$APP_PATH"

# Launch the app
echo "Launching app..."
xcrun simctl launch booted golf.spicy

# Wait for app to start and connect to Metro
echo "Waiting for app to start..."
sleep 5

# Check Metro logs for app connection
echo "Checking Metro logs for app connection..."
tail -20 "$OUTPUT_DIR/metro.log"

# Give a bit more time for app to fully initialize
sleep 5

# Run E2E tests
export PATH="$PATH":"$HOME/.maestro/bin"
export MAESTRO_DRIVER_STARTUP_TIMEOUT=300000
export MAESTRO_CLI_NO_ANALYTICS=1
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

echo "Running End-to-End tests on iOS..."
# Run each flow in subdirectories (Maestro doesn't recurse by default)
maestro test \
  tests/e2e/flows/five_points/basic_game.yaml \
  --config tests/e2e/.maestro/config.yml \
  --env PLATFORM=ios \
  --format junit \
  --output "$OUTPUT_DIR/e2e-results.xml" \
  --test-output-dir "$OUTPUT_DIR"

echo "Listing Output Directory"
ls -la "$OUTPUT_DIR"
