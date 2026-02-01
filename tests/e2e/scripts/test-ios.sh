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

# Install app to simulator (Maestro will launch it)
echo "Installing app to iOS Simulator..."
xcrun simctl install booted "$APP_PATH"

# Run E2E tests
export PATH="$PATH":"$HOME/.maestro/bin"
export MAESTRO_DRIVER_STARTUP_TIMEOUT=300000
export MAESTRO_CLI_NO_ANALYTICS=1
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

echo "Running cleanup to remove leftover games..."
# Run cleanup first (don't fail if it has issues)
maestro test \
  tests/e2e/flows/shared/cleanup_games.yaml \
  --config tests/e2e/.maestro/config.yml \
  --env PLATFORM=ios \
  --env TEST_PASSPHRASE="$TEST_PASSPHRASE" \
  --test-output-dir "$OUTPUT_DIR" \
  || echo "Cleanup completed (errors are expected if no games exist)"

echo "Running End-to-End tests on iOS..."
# Run smoke tests (all flows in the smoke directory)
maestro test \
  tests/e2e/flows/five_points/smoke/ \
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
