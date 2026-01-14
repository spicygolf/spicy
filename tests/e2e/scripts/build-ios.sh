#!/bin/bash

set -e

OUTPUT_DIR="/tmp/e2e-output"
mkdir -p "$OUTPUT_DIR"

# Build app (Debug mode - faster, uses pre-built binaries)
# RCT_USE_PREBUILT_RNCORE speeds up builds by using pre-built React Native core
export RCT_USE_PREBUILT_RNCORE=1

# ccache configuration for faster rebuilds (if USE_CCACHE=1 is set)
if [ "$USE_CCACHE" = "1" ]; then
  echo "ccache is enabled"
  export CCACHE_SLOPPINESS=clang_index_store,file_stat_matches,include_file_ctime,include_file_mtime,ivfsoverlay,pch_defines,modules,system_headers,time_macros
  export CCACHE_FILECLONE=true
  export CCACHE_DEPEND=true
  export CCACHE_INODECACHE=true
  # Show ccache stats before build
  ccache --show-stats || true
fi

echo "Building iOS app..."
echo "Build logs will be written to 'ios-build.log' in uploaded artifacts"

cd packages/app

# Build the app using xcodebuild directly for better control
# This builds to a known location we can cache
DERIVED_DATA_PATH="$HOME/Library/Developer/Xcode/DerivedData/SpicyGolf-e2e"

# Use clang with ccache if enabled
if [ "$USE_CCACHE" = "1" ]; then
  export CC="ccache clang"
  export CXX="ccache clang++"
fi

xcodebuild \
  -workspace ios/spicygolf.xcworkspace \
  -scheme spicygolf \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination "generic/platform=iOS Simulator" \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  ARCHS=arm64 \
  ONLY_ACTIVE_ARCH=NO \
  CODE_SIGNING_ALLOWED=NO \
  build \
  > "$OUTPUT_DIR/ios-build.log" 2>&1 || {
    echo "=== iOS build failed! Last 100 lines of log: ==="
    tail -100 "$OUTPUT_DIR/ios-build.log"
    echo "=== End of log ==="
    exit 1
  }

# Show ccache stats after build
if [ "$USE_CCACHE" = "1" ]; then
  echo "ccache stats after build:"
  ccache --show-stats || true
fi

echo "iOS build complete!"
echo "App location: $DERIVED_DATA_PATH/Build/Products/Debug-iphonesimulator/spicygolf.app"
