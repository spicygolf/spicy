# API Authentication Strategy for Passkey-Only Auth

> **Related doc**: `passkey-auth-migration.md` - App-side passkey migration plan (Jazz PR #3334)
> 
> This doc focuses on **API-side auth** once passkeys are implemented.

## Context

With Jazz PR #3334 enabling passkey-only authentication, the API needs a new auth strategy that:
1. Protects GHIN proxy endpoints (only Spicy Golf users)
2. Protects Admin endpoints (Spicy Golf users + admin designation)
3. Remains stateless/edge-deployable (no SQLite)
4. Doesn't expose GHIN proxy to the world

## Key Finding: Jazz Has Built-in Stateless Auth

Jazz Tools provides `authenticateRequest()` - a **completely stateless** authentication function:

```typescript
// Client-side: Generate token (1 line)
const token = generateAuthToken(myAccount);
// Returns: "signature_z...~co_z...~1704067200000"

// Server-side: Verify (no DB needed)
const { account, error } = await authenticateRequest(request);
if (error) return new Response(error.message, { status: 401 });
// account.$jazz.id is now the verified account ID
```

**How it works:**
1. Client signs `{accountId, timestamp}` with Ed25519 private key
2. Server loads account by ID (via Jazz sync, no DB)
3. Server verifies signature using account's public key
4. Token expires after 1 minute (configurable) - prevents replay attacks

**This is perfect for edge deployment** - no session state, no database, just cryptographic verification.

---

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MOBILE APP                           │
│  - generateAuthToken(account) for each API request     │
│  - Token in Authorization: Jazz <token> header         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              API (Stateless - Edge Deploy)              │
│                                                         │
│  Middleware: authenticateRequest() verifies Jazz token  │
│                                                         │
│  Protected endpoints:                                   │
│  - GHIN proxy: requires valid Jazz account             │
│  - Admin endpoints: requires Jazz account + admin flag │
│  - Jazz credentials: public (just env vars)            │
└─────────────────────────────────────────────────────────┘
```

---

## Q1: Securing GHIN Proxy Endpoints

**Approach**: Require Jazz auth token on all GHIN proxy requests.

```typescript
// API middleware
app.derive(async ({ request }) => {
  const { account, error } = await authenticateRequest(request);
  return { jazzAccount: account, authError: error };
});

// GHIN endpoints - require valid Jazz account
app.post('/v4/ghin/players/search', ({ jazzAccount, authError }) => {
  if (authError || !jazzAccount) return error(401, 'Unauthorized');
  // ... proceed with GHIN call
});
```

**Security properties:**
- Only users with a valid Jazz account can call GHIN proxy
- Token is short-lived (1 min) - stolen tokens expire quickly
- No rate limiting needed per se (GHIN has their own limits)
- Account ID is verified cryptographically, can't be spoofed

---

## Q2: Securing Admin Endpoints

**Approach**: Jazz auth + admin designation check.

**Option A: Environment Variable (Simple)**
```typescript
// packages/api/src/utils/auth.ts
const ADMIN_ACCOUNT_IDS = process.env.ADMIN_ACCOUNT_IDS?.split(',') || [];

export function isAdmin(accountId: string): boolean {
  return ADMIN_ACCOUNT_IDS.includes(accountId);
}

// Admin endpoint
app.post('/v4/catalog/import', ({ jazzAccount, authError }) => {
  if (authError || !jazzAccount) return error(401, 'Unauthorized');
  if (!isAdmin(jazzAccount.$jazz.id)) return error(403, 'Forbidden');
  // ... proceed
});
```

**Option B: Jazz CoMap Flag (More Flexible)**
```typescript
// In PlayerAccount schema, add isAdmin field
// Worker account sets this flag for admin users
// Check: account.root?.isAdmin === true
```

**Recommendation**: Start with Option A (env var). It's simpler, works for a small admin list, and doesn't require schema changes. Can migrate to Option B later if needed.

---

## Q3: Do We Need OPA/REGO?

**No.** OPA/REGO is overkill for this use case.

**Why:**
- We have exactly 2 authorization rules: "is authenticated" and "is admin"
- Both can be expressed in ~10 lines of TypeScript
- No complex policy logic (no RBAC, no resource-based permissions)
- OPA adds deployment complexity (sidecar or WASM bundle)

**When OPA makes sense:**
- Many roles with overlapping permissions
- Resource-level access control (user X can edit document Y)
- Policy changes need to be decoupled from code deploys
- Compliance/audit requirements for policy versioning

**For Spicy Golf**: Simple middleware checks are sufficient and more maintainable.

---

## Q4: Testing Strategy

### Unit Tests for Auth Middleware

```typescript
import { describe, test, expect } from 'bun:test';
import { authenticateRequest } from 'jazz-tools';

describe('GHIN proxy auth', () => {
  test('rejects request without auth header', async () => {
    const req = new Request('http://api/v4/ghin/players/search', {
      method: 'POST',
      body: JSON.stringify({ query: 'test' }),
    });
    const { error } = await authenticateRequest(req);
    expect(error).toBeDefined();
  });

  test('rejects expired token', async () => {
    // Create a token with old timestamp
    const expiredToken = 'signature_z...~co_z...~1600000000000';
    const req = new Request('http://api/v4/ghin/players/search', {
      method: 'POST',
      headers: { Authorization: `Jazz ${expiredToken}` },
    });
    const { error } = await authenticateRequest(req);
    expect(error?.message).toContain('expired');
  });

  test('rejects tampered token', async () => {
    // Modify the account ID in a valid token
    const tamperedToken = 'signature_z...~co_zTAMPERED~1704067200000';
    const req = new Request('http://api/v4/ghin/players/search', {
      method: 'POST', 
      headers: { Authorization: `Jazz ${tamperedToken}` },
    });
    const { error } = await authenticateRequest(req);
    expect(error?.message).toContain('Invalid');
  });
});
```

### Integration Tests (E2E)

```typescript
describe('GHIN proxy integration', () => {
  test('authenticated user can search players', async () => {
    // Setup: create a test Jazz account
    const testAccount = await createTestAccount();
    const token = generateAuthToken(testAccount);
    
    const res = await fetch('http://localhost:3000/v4/ghin/players/search', {
      method: 'POST',
      headers: { Authorization: `Jazz ${token}` },
      body: JSON.stringify({ lastName: 'Smith', state: 'CA' }),
    });
    
    expect(res.status).toBe(200);
  });

  test('unauthenticated user gets 401', async () => {
    const res = await fetch('http://localhost:3000/v4/ghin/players/search', {
      method: 'POST',
      body: JSON.stringify({ lastName: 'Smith', state: 'CA' }),
    });
    
    expect(res.status).toBe(401);
  });
});

describe('Admin endpoints', () => {
  test('non-admin user gets 403', async () => {
    const regularUser = await createTestAccount();
    const token = generateAuthToken(regularUser);
    
    const res = await fetch('http://localhost:3000/v4/catalog/import', {
      method: 'POST',
      headers: { Authorization: `Jazz ${token}` },
    });
    
    expect(res.status).toBe(403);
  });

  test('admin user can import', async () => {
    const adminAccount = await createTestAccount();
    process.env.ADMIN_ACCOUNT_IDS = adminAccount.$jazz.id;
    const token = generateAuthToken(adminAccount);
    
    const res = await fetch('http://localhost:3000/v4/catalog/import', {
      method: 'POST',
      headers: { Authorization: `Jazz ${token}` },
    });
    
    expect(res.status).toBe(200);
  });
});
```

### Test Utilities (Already in Jazz)

Jazz provides these out of the box:
```typescript
import { createJazzTestAccount } from 'jazz-tools/testing';
import { authenticateRequest, generateAuthToken } from 'jazz-tools';

// Create test account
const account = await createJazzTestAccount({ isCurrentActiveAccount: true });

// Generate token for that account
const token = generateAuthToken(); // uses active account
// or: generateAuthToken(specificAccount);
```

No custom test utilities needed - Jazz has comprehensive testing support.

---

## Implementation Files

| File | Changes |
|------|---------|
| `packages/api/src/index.ts` | Add Jazz auth middleware, protect GHIN routes |
| `packages/api/src/utils/auth.ts` | Update `isAdmin()` to check account IDs instead of emails |
| `packages/api/src/utils/rate-limit.ts` | New: per-account rate limiter |
| `packages/app/src/lib/api-client.ts` | Add auth token generation to all API requests |
| `packages/api/package.json` | Ensure jazz-tools is a dependency |
| `packages/api/src/*.test.ts` | Add auth + rate limit tests using Jazz's built-in test utilities |

---

## Decisions Made

1. **Token refresh**: Fresh token for every API request (simplest approach)
2. **Admin designation**: Env var (`ADMIN_ACCOUNT_IDS`) for now. Player schema has `level` in types but not Jazz CoMap - can add later if needed.
3. **Rate limiting**: Yes - prevent data mining beyond normal app usage

---

## Rate Limiting Strategy

**Goal**: Allow normal app/web usage, prevent excessive API abuse.

**Approach**: Per-account rate limits using in-memory store (edge-compatible).

```typescript
// Simple in-memory rate limiter (resets on deploy, which is fine)
const rateLimits = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMITS = {
  'ghin/players/search': { max: 30, windowMs: 60_000 },   // 30/min
  'ghin/courses/search': { max: 30, windowMs: 60_000 },   // 30/min
  'ghin/courses/details': { max: 60, windowMs: 60_000 },  // 60/min (course setup)
  'ghin/countries': { max: 10, windowMs: 60_000 },        // 10/min (rarely needed)
};

function checkRateLimit(accountId: string, endpoint: string): boolean {
  const key = `${accountId}:${endpoint}`;
  const limit = RATE_LIMITS[endpoint];
  const now = Date.now();
  
  const entry = rateLimits.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + limit.windowMs });
    return true;
  }
  
  if (entry.count >= limit.max) return false;
  entry.count++;
  return true;
}
```

**Why in-memory is fine for edge:**
- Limits reset on redeploy (acceptable - not security-critical)
- Each edge instance has its own limits (distributed = harder to abuse)
- No external dependencies (Redis, etc.)
- Can upgrade to Cloudflare Durable Objects or similar if needed later

**Rate limit headers** (standard):
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1704067260
```

**429 response** when exceeded:
```json
{ "error": "Rate limit exceeded", "retryAfter": 45 }
```

---

## Local Development: Passphrase Auth

**Problem**: Passkeys don't work in iOS Simulator or Android Emulator - they require real device biometrics and Secure Enclave/TEE.

**Solution**: Jazz supports passphrase-only auth as fallback. Use this for local dev.

### Dev Auth Flow

```typescript
// In Jazz provider setup, detect simulator/emulator
const isSimulator = __DEV__ && (Platform.OS === 'ios' 
  ? !Device.isDevice  // expo-device
  : /* android emulator detection */);

// Use passphrase auth for dev, passkey for production
const authMethod = isSimulator ? 'passphrase' : 'passkey';
```

### Jazz Passphrase Auth (Already Supported)

```typescript
// Create account with passphrase only
const { account, secret } = await createAccount({
  authMethod: 'passphrase',
  // Returns BIP-39 mnemonic as `secret`
});

// Login with passphrase
const account = await loginWithPassphrase(mnemonic);
```

### Dev UX Options

**Option A: Auto-generate dev account**
```typescript
// On first launch in simulator, auto-create account
// Store passphrase in AsyncStorage (dev only!)
// Skip auth screens entirely in dev mode
```

**Option B: Simple passphrase input**
```typescript
// Show text input for passphrase in dev mode
// User can paste existing passphrase or generate new
// Matches production recovery flow
```

**Recommendation**: Option A for fastest iteration. Dev accounts are ephemeral anyway.

### Environment Detection

```typescript
// packages/app/src/lib/auth-mode.ts
import { Platform, NativeModules } from 'react-native';

export function getAuthMode(): 'passkey' | 'passphrase' {
  if (!__DEV__) return 'passkey';
  
  // iOS Simulator detection (no expo-device)
  // Simulator has specific model identifiers
  if (Platform.OS === 'ios') {
    const isSimulator = Platform.constants?.interfaceIdiom === 'simulator' 
      || NativeModules.PlatformConstants?.interfaceIdiom === 'simulator';
    if (isSimulator) return 'passphrase';
  }
  
  // Android Emulator detection
  if (Platform.OS === 'android') {
    // Emulators typically have 'google_sdk', 'sdk', or 'emulator' in fingerprint
    const isEmulator = NativeModules.PlatformConstants?.Fingerprint?.includes('emulator')
      || NativeModules.PlatformConstants?.Fingerprint?.includes('sdk');
    if (isEmulator) return 'passphrase';
  }
  
  // Real device in dev mode - can use passkey
  return 'passkey';
}

// Alternative: Just check __DEV__ and always use passphrase in dev
// Simpler, and real device testing with passkeys is rare during dev
export function getAuthModeSimple(): 'passkey' | 'passphrase' {
  return __DEV__ ? 'passphrase' : 'passkey';
}
```

### Files to Add/Modify

| File | Changes |
|------|---------|
| `packages/app/src/lib/auth-mode.ts` | New: detect simulator vs device |
| `packages/app/src/providers/jazz/index.tsx` | Use auth mode to select passkey vs passphrase |
| `packages/app/src/screens/auth/DevLogin.tsx` | New: simple passphrase input for dev |

---

## User Onboarding & GHIN Linking

### Registration Flow

```
┌─────────────────────────────────────────────────────────┐
│  1. CREATE ACCOUNT (Passkey)                            │
│     - FaceID/TouchID creates passkey                    │
│     - Jazz account created                              │
│     - Show recovery phrase                              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  2. BASIC PROFILE                                       │
│     - Name (required)                                   │
│     - Short/nickname (optional, suggest from name)      │
│     - Email (optional? for recovery reminder)           │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  3. GHIN LINKING (strongly encouraged)                  │
│     - Search GHIN by name/state                         │
│     - Select matching player                            │
│     - Link to account (first-come-first-served)         │
│     - Copy player data from catalog → user-owned        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  4. READY TO PLAY                                       │
│     - Handicap synced from GHIN                         │
│     - Can join/create games                             │
└─────────────────────────────────────────────────────────┘
```

### Profile Fields

| Field | Required | Notes |
|-------|----------|-------|
| `name` | Yes | Full name for display |
| `short` | No | Nickname for scorecard. Suggest: first name or "Brad S." |
| `email` | TBD | Useful for recovery reminders, not auth |
| `ghinId` | Encouraged | Links to GHIN handicap system |

### GHIN Linking Scenarios

**Scenario A: Link during onboarding (preferred)**
1. User searches GHIN during signup
2. Finds their player, taps "This is me"
3. Catalog player data copied to user's owned Player
4. Catalog entry removed (or marked as "claimed")
5. User owns their player data going forward

**Scenario B: Link later**
1. User skips GHIN during onboarding
2. Limited functionality (maybe X rounds without handicap?)
3. Settings → "Link GHIN Account"
4. Same flow as above

**Scenario C: No GHIN (discouraged)**
1. User never links
2. Consider: limit rounds, show reminders, or remove this path entirely

### Data Model Changes

```typescript
// PlayerAccount root gains profile fields
export const PlayerAccountRoot = co.map({
  player: Player,           // Their owned player (copied from catalog on link)
  email: z.string().optional(),
  games: ListOfGames,
  specs: ListOfGameSpecs,
  favorites: co.optional(Favorites),
});

// Player gains linking metadata
export const Player = co.map({
  name: z.string(),
  short: z.string().optional(),  // Make optional, derive if missing
  gender: z.literal(["M", "F"]),
  ghinId: z.string().optional(),
  legacyId: z.string().optional(),
  // New fields for linking
  claimedBy: z.string().optional(),  // Account ID that claimed this player
  claimedAt: z.date().optional(),
  // ... rest
});
```

### GHIN Linking Logic

```typescript
// packages/lib/src/linking/claim-player.ts

interface ClaimResult {
  success: boolean;
  error?: 'already_claimed' | 'not_found' | 'network_error';
  player?: Player;
}

async function claimGhinPlayer(
  account: PlayerAccount,
  ghinId: string,
  catalogPlayer: Player,
): Promise<ClaimResult> {
  // 1. Check if already claimed
  if (catalogPlayer.claimedBy) {
    return { success: false, error: 'already_claimed' };
  }
  
  // 2. Create user-owned copy of player
  const ownedPlayer = Player.create({
    name: catalogPlayer.name,
    short: catalogPlayer.short,
    gender: catalogPlayer.gender,
    ghinId: catalogPlayer.ghinId,
    handicap: catalogPlayer.handicap,  // Copy current handicap
    claimedBy: account.$jazz.id,
    claimedAt: new Date(),
  }, { owner: account });  // User owns their player
  
  // 3. Link to account
  account.root.player = ownedPlayer;
  
  // 4. Mark catalog player as claimed (or delete?)
  catalogPlayer.claimedBy = account.$jazz.id;
  catalogPlayer.claimedAt = new Date();
  
  return { success: true, player: ownedPlayer };
}
```

### Unlinking / Re-linking

**Unlink**: User can disconnect from GHIN
- Keep their Player data (now orphaned from GHIN)
- Clear `ghinId` on their player
- Catalog player `claimedBy` cleared (available for re-claim)

**Re-link**: User links to different GHIN ID
- Unlink first
- Then link to new GHIN player
- Edge case: what if someone else claimed the old one in between?

### Future: GHIN Ownership Verification

For posting scores to GHIN and preventing false claims:

**Option A: Email verification**
- GHIN has email on file
- Send verification code to that email
- User enters code in app

**Option B: GHIN login OAuth**
- GHIN may have an OAuth flow (needs research)
- User logs into GHIN, we get proof of ownership

**Option C: Manual verification**
- User submits claim
- Admin reviews (doesn't scale, but works for beta)

**For now**: First-come-first-served with clear "this is me" confirmation.

### Files to Modify

| File | Changes |
|------|---------|
| `packages/lib/schema/players.ts` | Add `claimedBy`, `claimedAt`, make `short` optional |
| `packages/lib/schema/accounts.ts` | No changes needed (already has `player`) |
| `packages/lib/linking/claim-player.ts` | New: claiming logic |
| `packages/app/src/screens/onboarding/` | New: onboarding flow screens |
| `packages/app/src/screens/settings/LinkGhin.tsx` | New: link GHIN from settings |

**Reference**: `packages/app-0.3/src/features/` has legacy onboarding/profile/linkHandicap code. Good for reference but use modern patterns from `packages/app`.

---

## Future Work: Player Merging (Out of Scope)

**Scenario**: A player was manually added to a game (no GHIN). Later, they sign up for Spicy and link their GHIN. We want to merge the manually-added player with their new account-owned player.

**Legacy 0.3 approach** (`packages/api-0.3/src/models/player.js:340`):
1. Copy profile data from source → target
2. Update all graph edges (player2game)
3. Update inline references in `game.holes.teams`
4. Leave tombstone on old player (`merged: { to: new_id }`)

**Jazz challenges**:
- No graph edges - references are inline CoValue IDs
- Need to find all games referencing old player ID
- Update `game.rounds[].playerId` entries
- Update any `team.players` lists
- Jazz `unstable_merge` is for branches, not merging different CoValues

**Implementation approach** (when needed):
```typescript
async function mergePlayer(
  sourcePlayerId: string,  // manually-added player
  targetPlayer: Player,    // user's owned player
): Promise<void> {
  // 1. Find all games with sourcePlayerId in rounds
  const affectedGames = await findGamesWithPlayer(sourcePlayerId);
  
  // 2. Update each game's rounds
  for (const game of affectedGames) {
    for (const round of game.rounds) {
      if (round.playerId === sourcePlayerId) {
        round.playerId = targetPlayer.$jazz.id;
      }
    }
    // Also update team.players if stored by ID
  }
  
  // 3. Copy any useful data from source
  if (!targetPlayer.short && sourcePlayer.short) {
    targetPlayer.short = sourcePlayer.short;
  }
  
  // 4. Mark source as merged (tombstone)
  sourcePlayer.mergedTo = targetPlayer.$jazz.id;
  sourcePlayer.mergedAt = new Date();
}
```

**Invitation flow** (related feature):
- "Email all players their round" button
- Sends registration link to non-Spicy players
- Link includes context to auto-merge on signup
- Requires: matching logic (email? invitation token?)


