#!/bin/bash

set -e

OUTPUT_DIR="/tmp/e2e-output"
mkdir -p "$OUTPUT_DIR"

# Build app (Debug mode - faster, uses pre-built binaries)
# RCT_USE_PREBUILT_RNCORE speeds up builds by using pre-built React Native core
export RCT_USE_PREBUILT_RNCORE=1
echo "Building iOS app..."
echo "Build logs will be written to 'ios-build.log' in uploaded artifacts"

cd packages/app

# Build the app using xcodebuild directly for better control
# This builds to a known location we can cache
DERIVED_DATA_PATH="$HOME/Library/Developer/Xcode/DerivedData/SpicyGolf-e2e"

xcodebuild \
  -workspace ios/spicygolf.xcworkspace \
  -scheme spicygolf \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=${IOS_SIMULATOR_DEVICE:-iPhone 16 Pro}" \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  build \
  > "$OUTPUT_DIR/ios-build.log" 2>&1 || {
    echo "=== iOS build failed! Last 100 lines of log: ==="
    tail -100 "$OUTPUT_DIR/ios-build.log"
    echo "=== End of log ==="
    exit 1
  }

echo "iOS build complete!"
echo "App location: $DERIVED_DATA_PATH/Build/Products/Debug-iphonesimulator/spicygolf.app"
