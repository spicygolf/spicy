#!/bin/bash
# Run E2E tests locally on iOS simulator
# Assumes simulator is running and app is installed
#
# Usage:
#   ./tests/e2e/scripts/run-ios-local.sh                    # Run main game_0 test
#   ./tests/e2e/scripts/run-ios-local.sh login.yaml         # Run specific flow
#   ./tests/e2e/scripts/run-ios-local.sh cleanup            # Run shared cleanup

set -e

# Get the booted iOS simulator UDID (allow lowercase UDIDs for safety)
IOS_DEVICE=$(xcrun simctl list devices | grep -i "(Booted)" | grep -oE "[0-9A-Fa-f-]{36}" | head -1 || true)

if [ -z "$IOS_DEVICE" ]; then
  echo "Error: No booted iOS simulator found"
  echo "Start a simulator first: open -a Simulator"
  exit 1
fi

echo "Using iOS simulator: $IOS_DEVICE"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
E2E_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="/tmp/maestro-local"

# Load environment variables
if [ -f "$E2E_DIR/.env" ]; then
  source "$E2E_DIR/.env"
else
  echo "Error: $E2E_DIR/.env not found"
  echo "Copy .env.example to .env and fill in your passphrases"
  exit 1
fi

# Use iOS-specific passphrase
if [ -z "$TEST_PASSPHRASE_IOS" ]; then
  echo "Error: TEST_PASSPHRASE_IOS not set in .env"
  exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Regenerate flows from DSL before running
echo "Regenerating flows from DSL..."
cd "$E2E_DIR/../.." && bun e2e:generate --quiet 2>/dev/null || bun e2e:generate
echo ""

# Determine which flow to run
FLOW="${1:-main.yaml}"

# Handle shortcuts
case "$FLOW" in
  cleanup)
    FLOW_PATH="$E2E_DIR/flows/shared/cleanup_deep.yaml"
    ;;
  login|login.yaml)
    FLOW_PATH="$E2E_DIR/flows/five_points/game_0/login.yaml"
    ;;
  main|main.yaml)
    FLOW_PATH="$E2E_DIR/flows/five_points/game_0/main.yaml"
    ;;
  *.yaml)
    # Check if it's a relative path or just a filename
    if [ -f "$FLOW" ]; then
      FLOW_PATH="$FLOW"
    elif [ -f "$E2E_DIR/flows/five_points/game_0/$FLOW" ]; then
      FLOW_PATH="$E2E_DIR/flows/five_points/game_0/$FLOW"
    elif [ -f "$E2E_DIR/flows/shared/$FLOW" ]; then
      FLOW_PATH="$E2E_DIR/flows/shared/$FLOW"
    else
      echo "Error: Flow not found: $FLOW"
      exit 1
    fi
    ;;
  *)
    # Try adding .yaml
    if [ -f "$E2E_DIR/flows/five_points/game_0/$FLOW.yaml" ]; then
      FLOW_PATH="$E2E_DIR/flows/five_points/game_0/$FLOW.yaml"
    elif [ -f "$E2E_DIR/flows/shared/$FLOW.yaml" ]; then
      FLOW_PATH="$E2E_DIR/flows/shared/$FLOW.yaml"
    else
      echo "Error: Flow not found: $FLOW"
      exit 1
    fi
    ;;
esac

echo "Running: $FLOW_PATH"
echo "Output:  $OUTPUT_DIR"
echo ""

MAESTRO_DEVICE="$IOS_DEVICE" maestro test "$FLOW_PATH" \
  --env TEST_PASSPHRASE="$TEST_PASSPHRASE_IOS" \
  --test-output-dir "$OUTPUT_DIR"

echo ""
echo "Screenshots and logs saved to: $OUTPUT_DIR"
