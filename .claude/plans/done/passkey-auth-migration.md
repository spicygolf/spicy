# Migration Plan: Remove SQLite Dependency from API

> **Related doc**: `api-auth-strategy.md` - API-side auth with Jazz tokens, rate limiting, onboarding flow

## Goal
Enable serverless/edge deployment of the API by removing the SQLite dependency used by better-auth.

## Current State
- **Mobile app**: Uses better-auth (email/password) → requires API with SQLite
- **API**: ElysiaJS with SQLite for auth sessions + GHIN proxy
- **No existing users** to migrate

## Approach: Passkey Auth (via Jazz RN Passkey Contribution)

**Pre-requisite**: Contribute passkey support to Jazz for React Native.
See companion doc: `jazz-rn-passkey-implementation.md`

**Why passkey:**
1. Best UX for unsophisticated users (FaceID/TouchID - no passwords to remember)
2. No server needed = truly serverless API  
3. Passkeys sync across devices via iCloud/Google automatically
4. Recovery passphrase available as fallback (same Jazz account)

### Architecture After Migration

```
┌─────────────────────────────────────────────────────────┐
│                    MOBILE APP                           │
│  Passkey auth (Jazz + react-native-passkey)            │
│  - First launch: create passkey via FaceID/TouchID     │
│  - Passkey syncs via iCloud/Google automatically       │
│  - Recovery: show passphrase, user can email/save      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    JAZZ CLOUD                           │
│  Syncs all user data (games, rounds, players, etc.)    │
│  Auth credentials stored in passkey (device-managed)   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              API (Stateless - Edge Deploy)              │
│  - GHIN proxy endpoints (no auth needed)               │
│  - Jazz credentials endpoint (env vars only)           │
│  - Admin endpoints (API key auth or remove)            │
└─────────────────────────────────────────────────────────┘
```

### Web App Auth (Future)
- Use Jazz passkey auth (fully supported in browsers)
- Same Jazz account, same passkey (synced by OS)
- Cross-ecosystem: QR code scan from phone to authenticate on web

## Implementation Steps

### Phase 0: Contribute Passkey Auth to Jazz (Pre-requisite)

**See**: `jazz-rn-passkey-implementation.md` for full details.

**Summary:**
1. Create `ReactNativePasskeyAuth` class in Jazz
2. Create `usePasskeyAuth` hook for React Native  
3. Add `react-native-passkey` as optional peer dependency
4. Submit PR to garden-co/jazz

### Phase 1: Mobile App - Replace better-auth with passkey auth

**Files to modify:**
- `packages/app/src/providers/jazz/index.tsx` - Remove AuthProvider, use passkey hook
- `packages/app/src/screens/auth/Login.tsx` - Replace with passkey login (FaceID/TouchID)
- `packages/app/src/screens/auth/Register.tsx` - Replace with passkey signup
- `packages/app/src/lib/auth-client.ts` - Remove (no longer needed)
- `packages/app/src/hooks/useJazzCredentials.ts` - Simplify (no auth session)
- `packages/app/src/navigators/AuthNavigator.tsx` - Update auth flow
- `packages/app/package.json` - Remove better-auth deps, add react-native-passkey

**New files:**
- `packages/app/src/screens/auth/ShowRecoveryPhrase.tsx` - Show passphrase for backup
- `packages/app/src/screens/auth/EnterRecoveryPhrase.tsx` - Fallback login with passphrase

**iOS Setup Required:**
- Configure Associated Domains entitlement in Xcode: `webcredentials:spicy.golf`
- Host AASA file at `https://spicy.golf/.well-known/apple-app-site-association`

**Android Setup Required:**
- Host assetlinks.json at `https://spicy.golf/.well-known/assetlinks.json`
- Configure app links in AndroidManifest.xml

### Phase 2: API - Remove SQLite and auth endpoints

**Files to modify:**
- `packages/api/src/index.ts` - Remove auth routes, simplify endpoints
- `packages/api/src/lib/auth.ts` - Delete entirely
- `packages/api/package.json` - Remove better-auth, bun:sqlite deps

**Files to delete:**
- `packages/api/data/auth.db` - SQLite database
- Auth-related utility files

**Endpoints after migration:**
| Endpoint | Purpose | Auth |
|----------|---------|------|
| `/v4/ghin/*` | GHIN proxy | Jazz token (see `api-auth-strategy.md`) |
| `/v4/jazz/credentials` | Jazz API key | None |
| `/v4/catalog/import*` | Admin imports | Jazz token + admin check |

### Phase 3: Deployment

**API deployment options (all now viable):**
- Cloudflare Workers
- AWS Lambda / Lambda@Edge
- Fly.io (without volume)
- Vercel Edge Functions
- Deno Deploy

## UX Flow for Unsophisticated Users

### First Launch (New User)
1. Welcome screen: "Create Your Account"
2. Tap "Sign Up" → FaceID/TouchID prompt
3. Passkey created automatically, synced to iCloud/Google
4. Show recovery phrase screen (optional to save)
5. Continue to app

### Login on Same Ecosystem Device
1. Tap "Log In" → FaceID/TouchID prompt  
2. Passkey retrieved from iCloud/Google automatically
3. Logged in!

### Login on Different Ecosystem (e.g., Android → iOS)
1. Browser shows QR code
2. Scan with phone that has passkey
3. Authenticate on phone
4. Logged in on new device

### Recovery (Lost All Devices)
1. Tap "Recover Account"
2. Enter recovery passphrase
3. Create new passkey on this device
4. Back in business

### Recovery Phrase Security Note
- Phrase cannot be changed once created
- If compromised, user must create new account
- Show once after signup, can view again in settings

## Decisions Made

1. **Admin endpoints**: Keep with API key auth, restricted to certain Jazz accounts
2. **Player linking**: Will become Jazz-only after ArangoDB migration complete
   - Currently needs API because: worker owns catalog, imports from ArangoDB, grants group access
   - Future: Once legacy import done, can be client-side Jazz operation
3. **Domain for passkeys**: `spicy.golf`
4. **Recovery phrase UX**: Show after signup AND accessible in settings

## Dependencies to Add/Remove

### Mobile App
```diff
- "better-auth"
- "@better-auth/client"  
+ "react-native-passkey"
+ "@scure/bip39" (for recovery passphrase, likely already in jazz-tools)
```

### API
```diff
- "better-auth"
- "bun:sqlite" (implicit)
```

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Users lose passkey & phrase | Show recovery phrase prominently, allow email/copy |
| AASA/assetlinks misconfigured | Clear setup guide, test on real devices early |
| Passkey not supported (old device) | Fall back to passphrase-only auth |
| Web app needs same account | Same passkey syncs via OS, or use recovery phrase |

## Local Development

**Problem**: Passkeys don't work in iOS Simulator or Android Emulator.

**Solution**: Use Jazz passphrase-only auth in dev mode. See `api-auth-strategy.md` for details on environment detection and dev auth flow.

## Sequence of Work

```
1. Jazz RN Passkey PR (in ~/dev/jazz)
   └── Get merged & released

2. Spicy App Auth Migration  
   ├── Add react-native-passkey
   ├── Configure iOS Associated Domains
   ├── Configure Android app links
   ├── Host AASA & assetlinks files
   ├── Replace auth screens
   ├── Add dev mode passphrase auth
   └── Remove better-auth

3. Spicy API Simplification
   ├── Add Jazz auth middleware (see api-auth-strategy.md)
   ├── Add rate limiting
   ├── Remove SQLite/better-auth
   └── Deploy to edge
```
