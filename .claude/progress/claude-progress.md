# Passkey Authentication Migration

## Status: READY FOR TESTING

## Branch: feat/passkey-auth

## Commits

1. **67fb1db** - chore: upgrade Jazz to 0.19.22 for passkey support
2. **c8c8eb4** - chore: add react-native-passkey dependency
3. **33e44d8** - feat: add AuthUI with passkey + passphrase fallback
4. **1b53401** - feat(ios): configure Associated Domains for passkey auth
5. **e1e5c7f** - feat(android): configure app links for passkey auth
6. **8e5290b** - docs: add well-known files templates for passkey auth
7. **86338a0** - refactor: remove old PassphraseAuthUI (replaced by AuthUI)
8. **9e0a0e2** - docs: update progress file for passkey migration
9. **a1357f8** - fix: pass undefined instead of empty string to useCoState
10. **d6c4925** - feat: add logout option to ErrorBoundary for stuck users
11. **d9fad01** - fix(app): prevent Jazz subscription error with undefined IDs

## What Was Done

### Jazz Upgrade
- Upgraded `jazz-tools` and `cojson-core-rn` from 0.19.10 to 0.19.22
- Passkey support was added in Jazz 0.19.20

### New AuthUI Component
- Created `packages/app/src/providers/jazz/AuthUI.tsx`
- Primary: Passkey auth (FaceID/TouchID) for production on real devices
- Fallback: Passphrase auth for:
  - Development mode (simulators don't support passkeys)
  - Users who prefer passphrase
  - Recovery when passkey is unavailable
- Auto-detects dev mode (`__DEV__`) and skips passkey UI

### iOS Configuration
- Created `packages/app/ios/spicygolf/spicygolf.entitlements`
- Added `webcredentials:spicy.golf` to Associated Domains
- Referenced entitlements in Debug and Release build configs

### Android Configuration
- Added `android:autoVerify="true"` intent-filter for `https://spicy.golf`
- Required for Android passkey/WebAuthn

### Well-Known Files
- Created `.well-known/apple-app-site-association` (needs TEAM_ID)
- Created `.well-known/assetlinks.json` (needs SHA256 fingerprint)
- Created README with setup instructions
- **Verified both files are being served at https://spicy.golf**

### Bug Fixes
- Fixed `useCoState` in GameContext passing empty string instead of undefined
- Added "Log Out & Restart" option to ErrorBoundary for stuck users
- Fixed Jazz subscription errors by removing `|| ""` patterns from useCoState calls in:
  - GameListItem.tsx
  - useCurrentHole.ts
  - useJazzWorker.ts
  - useGame.ts
  - usePlayer.ts
  - usePlayers.ts
  - useRound.ts
  - teams/index.tsx

## Next Steps (Manual)

1. **Update well-known files** with actual values:
   - Replace `TEAM_ID` in apple-app-site-association
   - Replace `SHA256_FINGERPRINT_HERE` in assetlinks.json
   
2. **Test on real device**:
   - Passkey signup/login with FaceID/TouchID
   - Passphrase fallback when passkey fails
   - Dev mode passphrase-only flow
   - Error boundary logout recovery

3. **Run pod install** after pulling this branch:
   ```bash
   cd packages/app && bun pods
   ```
