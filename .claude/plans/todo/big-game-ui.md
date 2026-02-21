# Plan: Big Game UI Fixes

## Context

The Big Game (Chicago / Quota) has its scoring engine in place (`spec_type: "quota"`, quota-engine, quota-metrics, bets schema) but the UI doesn't yet reflect quota-game behavior. Several issues need addressing.

## Issues

### 1. Remove pops-related options from Big Game spec

The Big Game currently has `use_handicaps` and `handicap_index_from` in its options list. These are pops-related options that don't apply to quota games — handicaps feed into quota calculation (36 - courseHandicap), not per-hole stroke adjustments.

`spec_type: "quota"` is sufficient to drive the correct pipeline behavior. Remove both options from the Big Game seed spec.

**Files**: `data/seed/specs/the_big_game.json`

### 2. Quota-relative running totals in Game Scoring

Currently the scoring view shows pops-style display: "Hole: 2 x 1 = 2" with a running point total. For quota games, the display should show:

- **Hole column**: Stableford points earned (e.g., `2` for par, `3` for birdie)
- **Running column**: Performance vs quota (e.g., `E` for even, `-1`, `+2`)

Example flow for a player with front-nine quota of 14:
| Hole | Score | Stableford | Running |
|------|-------|-----------|---------|
| 1 | Par | 2 | E |
| 2 | Bogey | 1 | -1 |
| 3 | Birdie | 3 | E |
| 4 | Par | 2 | E |
| 5 | Bogey | 1 | -1 |

The running total resets concept at hole 10 (back nine quota).

**Needs investigation**: How the scoring view currently renders hole results, where running totals are computed, and how to conditionally switch display mode based on `spec_type`.

### 3. Quota display in player/game info

Players should see their quota somewhere — either in the game lobby, scoring header, or player info area. Something like "Quota: 29 (F14 / B15)".

**Needs investigation**: Where to surface this in existing UI patterns.

## What's NOT in scope

- Settlement UI (separate plan: `settlement-engine.md`)
- Bet management / editing UI
- Quota leaderboard
- Nassau / press UI

## Dependencies

- Scoring engine work from `bets-quota-handicaps.md` (done)
- Seed data re-seeding after option removal
