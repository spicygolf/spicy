# Plan: Big Game UI Fixes

## Context

The Big Game (Chicago / Quota) has its scoring engine in place (`spec_type: "quota"`, quota-engine, quota-metrics, bets schema) but the UI doesn't yet reflect quota-game behavior and there are skins scoring bugs.

## Issues

### 1. Remove pops-related options from Big Game spec — DONE

Removed `use_handicaps` and `handicap_index_from` from the Big Game seed spec. `spec_type: "quota"` drives the correct pipeline behavior.

**Commit**: `2bdd7845`

### 2. Skins scoring: chop logic broken

When two or more players get birdie on the same hole, the skin should be "chopped" — nobody wins it. Currently skins are still being awarded. Root cause: `shouldAwardJunk()` in `junk-engine.ts` returns early on `score_to_par` check without also checking `logic` (which contains the `rankWithTies: [1, 1]` uniqueness requirement).

**Files**: `packages/lib/scoring/junk-engine.ts`, tests

### 3. Skins scoring: eagle doesn't properly override birdie

If someone eagles and someone else birdies the same hole, the eagle should win and the birdie junk should not appear. The `gross_eagle_skin` has lower seq (processed first) and `score_to_par: "at_most -2"`, but `gross_skin` (seq 10, `at_most -1`) still awards the birdie player a skin. Need a mechanism to prevent `gross_skin` from awarding when `gross_eagle_skin` was already awarded on the same hole.

**Files**: `packages/lib/scoring/junk-engine.ts`, seed data, tests

### 4. Remove star icons from earned junk badges

The star icons on earned junk badges should be removed.

**Needs investigation**: Which component renders the star icon on junk badges.

### 5. Skin junk label: just "Skin"

Regardless of the type (Birdie, Eagle, etc.), the label on skin junk badges should just say "Skin". Keep the trophy icon.

**Files**: Junk badge display component, possibly seed data `disp` field

### 6. Leaderboard button group

Remove "Net" from the button group at the top of the leaderboard. Options should be: Gross, Points, Skins.

Also, the totals for Out (front), In (back), and Total on the "Points" tab should be quota-relative (showing performance vs quota, not raw stableford points).

**Needs investigation**: Leaderboard component structure.

### 7. Quota display on handicap badge + quota override

Replace the handicap display on the Game Settings Players List with quota information for quota games. Instead of "course" and "shots", show the player's quota.

Also need the ability to override a player's 18-hole quota on the handicap override screen when `spec_type` is "quota". The front/back split calculation stays the same.

**Needs investigation**: HandicapBadge component, handicap override screen.

### 8. Quota-relative running totals in Game Scoring

Currently the scoring view shows pops-style display. For quota games, show:

- **Hole column**: Stableford points earned (e.g., `2` for par, `3` for birdie)
- **Running column**: Performance vs quota (e.g., `E` for even, `-1`, `+2`)

Running total resets at hole 10 (back nine quota).

**Needs investigation**: Scoring view components, running total computation.

## What's NOT in scope

- Settlement UI (separate plan: `settlement-engine.md`)
- Bet management / editing UI
- Nassau / press UI

## Dependencies

- Scoring engine work from `bets-quota-handicaps.md` (done)
- Seed data re-seeding after option removal
