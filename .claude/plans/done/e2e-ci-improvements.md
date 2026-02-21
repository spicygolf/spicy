# E2E CI Improvements Plan

## Current Issues

### Issue 1: iOS — Jazz credentials missing at runtime

**Symptom**: `[Error: Missing required Jazz credentials: JAZZ_API_KEY, JAZZ_WORKER_ACCOUNT]`

**Root cause**: The `.env` file step uses `secrets.*` for `JAZZ_API_KEY` and `JAZZ_WORKER_ACCOUNT`, but these are configured as **environment variables** (`vars.*`) in the `dev` environment, not secrets:

```yaml
# CURRENT (broken)
JAZZ_API_KEY=${{ secrets.JAZZ_API_KEY }}        # empty — not a secret
JAZZ_WORKER_ACCOUNT=${{ secrets.JAZZ_WORKER_ACCOUNT }}  # empty — not a secret

# Only JAZZ_WORKER_SECRET is an actual secret in the dev environment
```

**Fix**: Change the `.env` creation step to use `vars.*` for variables and `secrets.*` for secrets:

```yaml
- name: Create app .env file
  run: |
    cat > packages/app/.env << EOF
    DEV_API_HOST=
    JAZZ_API_KEY=${{ vars.JAZZ_API_KEY }}
    JAZZ_WORKER_ACCOUNT=${{ vars.JAZZ_WORKER_ACCOUNT }}
    POSTHOG_API_KEY=${{ secrets.POSTHOG_API_KEY }}
    POSTHOG_HOST=${{ vars.POSTHOG_HOST }}
    EOF
```

This fix applies to **both** the iOS and Android jobs.

### Issue 2: Android — Metro hangs, never reaches 100%

**Symptom**: Metro bundler appears to hang during the Android test phase. The `test-android.sh` script starts Metro via `bun dev` (which runs `react-native start --client-logs`) and waits 30 seconds for `/status`, but:

1. The Metro status endpoint may respond before the JS bundle is actually ready
2. On Android (Linux CI, x86_64 emulator), bundle compilation takes longer
3. No explicit bundle readiness check — script only checks `/status`, not an actual bundle request

**Fix**: Add bundle readiness polling after the status check, matching the rnqc pattern:

```bash
# After Metro status is up, also wait for the bundle to compile
echo "Waiting for bundle to be ready..."
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
```

Apply the same pattern to `test-ios.sh` (with `platform=ios`).

### Issue 3: Android — `[Failed] main (23s) (Assertion is false: "Spicy Golf" is visible)`

**Symptom**: The first Maestro assertion fails — the app can't display "Spicy Golf" login screen.

**Root cause**: Likely a combination of Issue 1 (missing env vars → crash before login screen renders) and Issue 2 (Metro not ready → JS bundle not loaded). Fixing Issues 1 and 2 should resolve this. If it persists, the app is crashing at startup before the login screen — check the uploaded `logcat.log` artifact.

## Caching Improvements (from rnqc patterns)

The rnqc project uses several superior caching patterns that spicy should adopt.

### Improvement 1: Stable cache keys (no hash-based rotation)

**Current spicy approach**: Cache keys include file hashes, causing cache misses whenever Podfile.lock or gradle files change:

```yaml
key: pods-${{ runner.os }}-${{ hashFiles('packages/app/ios/Podfile.lock') }}
```

**rnqc approach**: Uses stable cache keys that always hit, with the `save` action overwriting on every run. This means the cache is always "warm" from the last CI run, even if files changed:

```yaml
key: ${{ runner.os }}-pods    # Always hits, always saves
```

**Trade-off**: Hash-based keys are "correct" (exact match), but stable keys are more practical — a partial cache is faster than a cold start even if some files changed. CocoaPods and Gradle are incremental build systems; they handle the delta efficiently.

**Files to change**: All cache restore/save steps in `e2e.yml`.

### Improvement 2: Boot iOS Simulator in background during build

**rnqc pattern**: Starts simulator boot as a background process _before_ the Xcode build, then waits for it after the build:

```yaml
- name: Boot iOS Simulator (background)
  run: xcrun simctl boot "${{ env.DEVICE_NAME }}" &

# ... build steps ...

- name: Wait for Simulator
  run: xcrun simctl bootstatus "${{ env.DEVICE_NAME }}" -b
```

**Current spicy approach**: Boots the simulator as a blocking step _after_ the build, adding ~30s of serial wait time.

### Improvement 3: Split Android into build/test jobs (parallel AVD)

**rnqc pattern**: Splits Android into 3 parallel jobs:
- `build` — Gradle build + upload APK artifact
- `avd` — Create/cache AVD snapshot (runs in parallel with build)
- `test` — Download APK, restore AVD, run tests

This saves ~2-3 minutes because the AVD setup happens during the build.

**Current spicy approach**: Single job does build → AVD → test serially.

### Improvement 4: Explicit Metro readiness with bundle pre-warm

**rnqc pattern**: After Metro's `/status` returns OK, also requests the actual bundle to ensure it's compiled:

```bash
for i in {1..120}; do
  if curl -sf "http://localhost:8081/index.bundle?platform=ios&dev=true&minify=false" > /dev/null 2>&1; then
    echo "Bundle is ready!"
    break
  fi
  sleep 1
done
```

This is the most reliable way to know Metro is truly ready. The `/status` endpoint responds as soon as Metro's HTTP server starts, but the JS bundle may still be compiling.

### Improvement 5: Use hendrikmuhs/ccache-action for iOS

**rnqc pattern**: Uses the `hendrikmuhs/ccache-action` composite action which handles setup, symlinking, and stats in one step:

```yaml
- name: Setup ccache
  uses: hendrikmuhs/ccache-action@v1.2
  with:
    max-size: 1.5G
    key: ${{ runner.os }}-ccache-ios-e2e
    create-symlink: true
```

**Current spicy approach**: Manual ccache install via brew + manual cache restore/save + manual stats. The composite action is cleaner and handles edge cases.

### Improvement 6: Cache node_modules

Neither workflow caches `node_modules` / the bun install output. With the monorepo and many dependencies, `bun install` takes 15-30 seconds. Add:

```yaml
- name: Restore node_modules cache
  uses: WarpBuilds/cache/restore@v1
  with:
    path: node_modules
    key: node-modules-${{ runner.os }}-${{ hashFiles('bun.lock') }}

- name: Install dependencies
  run: bun install

- name: Save node_modules cache
  if: always()
  uses: WarpBuilds/cache/save@v1
  with:
    path: node_modules
    key: node-modules-${{ runner.os }}-${{ hashFiles('bun.lock') }}
```

## Implementation Order

| Priority | Fix | Impact | Effort |
|----------|-----|--------|--------|
| P0 | Fix `vars.*` vs `secrets.*` for Jazz credentials | Unblocks iOS + Android | 2 lines |
| P0 | Add bundle readiness polling in test scripts | Fixes Metro hang | ~10 lines per script |
| P1 | Boot simulator in background during build | -30s iOS | Move 2 steps |
| P1 | Switch to stable cache keys | Better hit rate | Rename keys |
| P2 | Split Android into parallel build/avd/test | -2-3min Android | Restructure jobs |
| P2 | Use hendrikmuhs/ccache-action | Cleaner config | Replace steps |
| P3 | Cache node_modules | -15-30s both | Add steps |

## Branch Strategy

New branch off main: `fix/e2e-ci-improvements`. The P0 fixes are needed immediately for the current PR's E2E runs.
