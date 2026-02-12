#!/bin/bash

set -e

OUTPUT_DIR="/tmp/e2e-output"
mkdir -p "$OUTPUT_DIR"

DERIVED_DATA_PATH="$HOME/Library/Developer/Xcode/DerivedData/SpicyGolf-e2e"
APP_PATH="$DERIVED_DATA_PATH/Build/Products/Debug-iphonesimulator/spicygolf.app"

# Load environment variables (platform-specific passphrases)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/../.env" ]; then
  source "$SCRIPT_DIR/../.env"
fi

# Use iOS-specific passphrase
TEST_PASSPHRASE="${TEST_PASSPHRASE_IOS:-$TEST_PASSPHRASE}"
if [ -z "$TEST_PASSPHRASE" ]; then
  echo "Error: TEST_PASSPHRASE_IOS not set. Please set it in tests/e2e/.env"
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

# Verify app exists
if [ ! -d "$APP_PATH" ]; then
  echo "Error: App not found at $APP_PATH"
  echo "Please run build-ios.sh first"
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
echo "Waiting for iOS bundle to be ready..."
for i in {1..120}; do
  if curl -sf "http://localhost:8081/index.bundle?platform=ios&dev=true&minify=false" > /dev/null 2>&1; then
    echo "Bundle is ready!"
    break
  fi
  if [ $i -eq 120 ]; then
    echo "Warning: Bundle may not be ready after 120s, continuing anyway..."
  fi
  sleep 1
done

# Install app to simulator (Maestro will launch it)
echo "Installing app to iOS Simulator..."
xcrun simctl install booted "$APP_PATH"

# Run E2E tests
export PATH="$PATH":"$HOME/.maestro/bin"
export MAESTRO_DRIVER_STARTUP_TIMEOUT=300000
export MAESTRO_CLI_NO_ANALYTICS=1
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

echo "Running End-to-End tests on iOS..."
maestro test \
  tests/e2e/flows/five_points/game_0/main.yaml \
  --config tests/e2e/.maestro/config.yml \
  --env PLATFORM=ios \
  --env TEST_PASSPHRASE="$TEST_PASSPHRASE" \
  --format junit \
  --output "$OUTPUT_DIR/e2e-results.xml" \
  --test-output-dir "$OUTPUT_DIR"

# Copy metro log to output directory for artifact upload
cp /tmp/spicy-metro.log "$OUTPUT_DIR/metro.log" 2>/dev/null || true

# Capture simulator system log for crash debugging
echo "Capturing simulator logs..."
xcrun simctl spawn booted log show --predicate 'subsystem == "golf.spicy" OR process == "spicygolf"' --last 5m > "$OUTPUT_DIR/simulator.log" 2>&1 || true

echo "Listing Output Directory"
ls -la "$OUTPUT_DIR"
