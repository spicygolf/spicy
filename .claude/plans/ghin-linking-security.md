# GHIN Linking Security Plan

## Status: PLANNED

## Problem

The current GHIN player linking is first-come-first-served: anyone who knows a GHIN ID can claim that player record. This could enable account hijacking if someone maliciously claims another user's GHIN before the legitimate owner.

## Current Implementation

```
User enters GHIN ID → API links player → Account now "owns" that GHIN player
```

No verification that the user actually owns the GHIN account.

## Risk Assessment

| Risk | Severity | Likelihood |
|------|----------|------------|
| Malicious claim before legitimate owner | Medium | Low |
| Claim a famous player's GHIN | Low | Low |
| Access to imported game history | Low | Low |

**Mitigating factors:**
- GHIN IDs are semi-private (not publicly listed)
- No sensitive data exposed (just handicap/game history)
- Can manually fix via admin intervention

## Proposed Solutions

### Option 1: Email Verification (Recommended)

Use the email associated with the GHIN account to verify ownership.

**Flow:**
1. User enters GHIN ID
2. System looks up GHIN player → gets email from GHIN API
3. Send one-time code to that email
4. User enters code → claim is verified → link is created

**Pros:**
- Strong verification using existing GHIN infrastructure
- No additional accounts/passwords
- GHIN already has verified emails

**Cons:**
- Requires GHIN API access to emails (may not be available)
- Adds friction to the flow
- Users with outdated GHIN emails may have issues

**Implementation:**
```typescript
// API endpoints
POST /player/claim-request
  body: { ghinId: string }
  returns: { success: true, verificationSent: true, emailHint: "j***@example.com" }

POST /player/claim-verify
  body: { ghinId: string, code: string }
  returns: { success: true, playerId: string, playerName: string }

// Schema additions
catalogPlayer.claimPendingBy = accountId
catalogPlayer.claimVerificationCode = "123456"
catalogPlayer.claimExpiresAt = Date.now() + 10 * 60 * 1000 // 10 min
```

### Option 2: GHIN OAuth (If Available)

Redirect to GHIN login flow to prove ownership.

**Pros:**
- Strongest verification
- No email issues

**Cons:**
- GHIN may not offer OAuth
- More complex implementation
- External dependency

### Option 3: Manual Review for Disputed Claims

Keep first-come-first-served but add dispute resolution.

**Flow:**
1. User A claims GHIN 1234567
2. User B tries to claim same GHIN → sees "already claimed"
3. User B can submit dispute with proof (GHIN screenshot, etc.)
4. Admin reviews and reassigns if legitimate

**Pros:**
- Simple to implement
- Handles edge cases manually
- No upfront friction for most users

**Cons:**
- Reactive, not preventive
- Admin overhead
- Bad UX for legitimate disputes

### Option 4: Rate Limiting + Monitoring

Keep current flow but add protections.

**Implementation:**
- Rate limit claims per account (e.g., 3 per day)
- Monitor for suspicious patterns (many claims, famous GHINs)
- Alert on disputed claims
- Admin ability to revoke/reassign

**Pros:**
- Minimal friction
- Can implement quickly

**Cons:**
- Doesn't prevent determined attackers
- Still reactive

## Recommendation

**Phase 1 (MVP):** Option 4 - Rate Limiting + Monitoring
- Quick to implement
- Low risk given app's current scale
- Add dispute flow for edge cases

**Phase 2 (When scaling):** Option 1 - Email Verification
- Implement once we have more users
- Only if GHIN API provides email access
- Otherwise fall back to Option 3

## Implementation Checklist

### Phase 1: Rate Limiting + Monitoring
- [ ] Add rate limit to `/player/link` endpoint (3/day per account)
- [ ] Log all GHIN link attempts with account ID
- [ ] Add admin endpoint to view recent links
- [ ] Add admin endpoint to unlink/reassign GHIN
- [ ] Add dispute submission flow in app
- [ ] Document dispute resolution process

### Phase 2: Email Verification (Future)
- [ ] Research GHIN API for email access
- [ ] Add pending claim state to schema
- [ ] Implement verification code generation
- [ ] Implement email sending
- [ ] Add verification UI in app
- [ ] Handle expired/invalid codes
- [ ] Add code retry limits

## Related Files

- `packages/api/src/lib/link.ts` - Current linking logic
- `packages/api/src/index.ts` - `/player/link` endpoint
- `packages/app/src/components/profile/LinkGhin.tsx` - UI component
- `packages/lib/schema/catalog.ts` - CatalogPlayer schema
