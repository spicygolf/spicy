#!/bin/bash

set -e

OUTPUT_DIR="/tmp/e2e-output"
mkdir -p "$OUTPUT_DIR"

# Cleanup function to kill Metro on exit
cleanup() {
  echo "Cleaning up..."
  if [ -n "$METRO_PID" ] && kill -0 "$METRO_PID" 2>/dev/null; then
    echo "Stopping Metro (PID: $METRO_PID)"
    kill "$METRO_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

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
    echo "Metro is ready!"
    break
  fi
  sleep 1
done

# Build and install app
echo "Building and installing app to iOS Simulator..."
echo "Build logs will be written to 'ios-build.log' in uploaded artifacts"
cd packages/app
bun ios --mode Release --simulator "${IOS_SIMULATOR_DEVICE:-iPhone 16 Pro}" > "$OUTPUT_DIR/ios-build.log" 2>&1
cd ../..

# Wait for app to be installed
echo "Waiting for app to be installed..."
sleep 10

# Run E2E tests
export PATH="$PATH":"$HOME/.maestro/bin"
export MAESTRO_DRIVER_STARTUP_TIMEOUT=300000
export MAESTRO_CLI_NO_ANALYTICS=1
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

echo "Running End-to-End tests on iOS..."
maestro test \
  tests/e2e/flows/ \
  --env PLATFORM=ios \
  --format junit \
  --output "$OUTPUT_DIR/e2e-results.xml"

echo "Listing Output Directory"
ls -la "$OUTPUT_DIR"
