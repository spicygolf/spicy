# Bets Data Model, Quota System, and Handicap Options

## Status: PLANNED

## Problem

The Big Game needs its quota scoring system and handicap options implemented. More broadly, Spicy needs a unified "bets" concept — every game has one or more bets, each a scored sub-competition with its own scope, scoring type, and payout rules.

## Unified Bet Model

Every game can be described in terms of bets:

| Game | Bets | Scope | Scoring | Split |
|------|------|-------|---------|-------|
| **Big Game** | front, back, overall, skins | front9/back9/all18 | quota / skins | places / per_unit |
| **Five Points** | (implicit single) | all18 | points | per_unit ($1/pt) |
| **Ten Points** | (implicit single) | all18 | points | per_unit |
| **Vegas** | (implicit single) | all18 | points | per_unit |
| **Dots** | (implicit single) | all18 | points | per_unit |
| **Match Play** | (implicit single) | all18 | match | per_unit |
| **Nassau** (future) | front, back, overall + presses | front9/back9/all18/rest_of_nine | match | winner_take_all |
| **Florida** (future) | overall + presses | all18/rest_of_round | match | winner_take_all |

Existing games that don't define explicit bets have an implicit single bet: `{ scope: "all18", scoringType: "points", pct: 100, splitType: "per_unit" }`. The `stakes` game option provides the per-unit dollar value. No seed changes needed for existing games — the engine infers the default bet.

For Big Game, bets are explicit in the seed spec. The `buy_in` option provides the total pot; each bet's `pct` determines its share.

This unifies settlement: the bet engine always resolves scope → metric → split, whether the game has 1 bet or 4.

### Funding model: pool vs zero-sum

The funding model is a **game-level** concern, not per-bet:

- **Pool-funded** (Big Game): `buy_in × playerCount = pot`. Bets carve up the pot by `pct`. You can't lose more than your buy-in.
- **Zero-sum** (Five Points, Vegas, etc.): No pot. Point differentials × `stakes` = direct transfers. Net always sums to $0. Uncapped (hence governor options like `discount_threshold`).

Determined by which game option is present (`buy_in` → pool, `stakes` → zero-sum). The Bet schema is the same for both — funding is orthogonal to bet structure. The settlement engine will branch on funding model when wired up; for now, it only handles pool-funded.

## Key Design Decisions

### 1. Gross Stableford
Big Game Stableford points are based on **gross** score-to-par. Handicaps affect your *quota* (target), not per-hole strokes/pops. Stableford seed files currently have `based_on: "net"` — changing to `"gross"`.

### 2. Quota Split (Approach A)
Compute one 18-hole quota (`36 - courseHandicap`), then split for odd values using front/back slope comparison. `front + back` always equals `overall`.

### 3. Bet scope is game.holes index-based
Bet scope uses `game.holes` list indices (0-based play order), not hole numbers. This handles shotgun starts (#106) where hole 10 might be `game.holes[0]`. "Front nine" = indices 0-8, "back nine" = indices 9-17, regardless of actual hole numbers.

### 4. Bet subsumes PayoutPool
A **Bet** = scope + scoring type + payout config. PayoutPool was payout-only (no scope or scoring type). The Bet model captures the full concept. Keep `payoutPools` on Game temporarily for backward compat; add `bets` as the new field.

### 5. Implicit default bet for existing games
Games without explicit bets get an inferred default: `{ scope: "all18", scoringType: "points", pct: 100, splitType: "per_unit" }`. No schema migration needed for Five Points, Vegas, etc.

---

## Steps

### Step 1: Bet data model

**New file**: `packages/lib/schema/bets.ts`

```typescript
/**
 * A Bet is a scored sub-competition within a game.
 *
 * Every game has at least one bet. Games like Five Points have a single
 * implicit bet covering all 18 holes. Big Game has four explicit bets
 * (front/back/overall quota + skins). Nassau has three (front/back/overall
 * match) plus dynamic press bets created mid-round.
 *
 * Scope is based on game.holes list indices (play order), not hole numbers.
 * This handles shotgun starts where play may begin on any hole.
 */
Bet = co.map({
  /** Bet identifier (e.g., "front", "back", "overall", "skins", "press_1") */
  name: z.string(),

  /** Display name (e.g., "Front Nine", "Press (Hole 7)") */
  disp: z.string(),

  /**
   * Which holes this bet covers (game.holes indices, 0-based play order).
   * - "front9": indices 0-8
   * - "back9": indices 9-17
   * - "all18": all indices
   * - "rest_of_nine": startHoleIndex through end of current nine (8 or 17)
   * - "rest_of_round": startHoleIndex through last hole
   */
  scope: z.enum(["front9", "back9", "all18", "rest_of_nine", "rest_of_round"]),

  /**
   * Starting game.holes index for dynamic bets (presses).
   * Only used when scope is "rest_of_nine" or "rest_of_round".
   * 0-based index into game.holes (play order, not hole number).
   */
  startHoleIndex: z.optional(z.number()),

  /**
   * How players/teams are ranked in this bet.
   * - "quota": stableford points minus quota (higher is better)
   * - "skins": count of skins won
   * - "points": cumulative point differential (existing games)
   * - "match": hole-by-hole match play result
   */
  scoringType: z.enum(["quota", "skins", "points", "match"]),

  /** Percentage of total pot (0-100). For single-bet games, always 100. */
  pct: z.number(),

  /**
   * How to split the bet's portion among winners.
   * - "places": pay top N places (use placesPaid + payoutPcts)
   * - "per_unit": split equally per unit (per skin, per point, etc.)
   * - "winner_take_all": single winner takes all
   */
  splitType: z.enum(["places", "per_unit", "winner_take_all"]),

  /** Number of places paid (for splitType: "places") */
  placesPaid: z.optional(z.number()),

  /** Custom payout percentages by place */
  payoutPcts: co.optional(co.list(z.number())),
});

ListOfBets = co.list(Bet);
```

**Modify**: `packages/lib/schema/games.ts` — add `bets: co.optional(ListOfBets)`
**Modify**: `packages/lib/schema/index.ts` — export bets

**Modify**: `data/seed/specs/the_big_game.json` — change `payout_pools` meta → `bets` meta:
```json
[
  { "name": "front", "disp": "Front Nine", "scope": "front9", "scoringType": "quota", "pct": 25, "splitType": "places" },
  { "name": "back", "disp": "Back Nine", "scope": "back9", "scoringType": "quota", "pct": 25, "splitType": "places" },
  { "name": "overall", "disp": "Overall", "scope": "all18", "scoringType": "quota", "pct": 25, "splitType": "places" },
  { "name": "skins", "disp": "Skins", "scope": "all18", "scoringType": "skins", "pct": 25, "splitType": "per_unit" }
]
```

No seed changes for existing games — the settlement engine infers a default single bet when `game.bets` is absent.

### Step 2: Quota calculation engine

**New file**: `packages/lib/scoring/quota-engine.ts`

- `calculateQuota(courseHandicap): number` — `36 - courseHandicap`
- `calculateNineHoleQuotas({ totalQuota, frontSlope?, backSlope? }): { front, back }` — split 18-hole quota; odd remainder to easier nine (higher slope = easier)
- `calculateQuotaPerformance(points, quota): number` — `points - quota`

**New file**: `packages/lib/scoring/__tests__/quota-engine.test.ts`

Test cases:
- Scratch: `quota(0) = 36`, plus: `quota(-4) = 40`, 10-hdcp: `quota(10) = 26`
- Even split: quota 28 → front 14, back 14
- Odd split, front harder (lower slope): quota 29 → front 14, back 15
- Odd split, back harder: quota 29 → front 15, back 14
- Equal slopes, odd: quota 29 → front 14, back 15 (back gets remainder by default)
- Performance: 18pts - 14q = +4, 12pts - 14q = -2

### Step 3: Fix stableford seed data — `based_on: "gross"`

**Modify** 5 files in `data/seed/options/`:
- `stableford_double_eagle.json`, `stableford_eagle.json`, `stableford_birdie.json`, `stableford_par.json`, `stableford_bogey.json`

Change `"based_on": "net"` → `"based_on": "gross"`. The junk engine (`junk-engine.ts:304`) then evaluates `scoreToPar` (gross) instead of `netToPar`.

### Step 4: Enforce `use_handicaps` in pipeline

**Modify**: `packages/lib/scoring/pipeline.ts` — `buildPlayerHandicaps()` (line 266)

- Read `use_handicaps` from options
- If false: `effectiveHandicap = 0` for all players (zero pops), still store real `courseHandicap`
- Skip "low" adjustment when disabled

### Step 5: Build player quotas in pipeline context

**Modify**: `packages/lib/scoring/types.ts` — add `playerQuotas?` to `ScoringContext`

**Modify**: `packages/lib/scoring/pipeline.ts` — add `buildPlayerQuotas()`:
- Only when `spec_type === "quota"`
- `use_handicaps=false` → `{ front: 18, back: 18, overall: 36 }` for all
- `use_handicaps=true` → per player: `calculateQuota(courseHandicap)` then `calculateNineHoleQuotas()` with front/back slopes from tee ratings

### Step 6: Quota metrics extraction from scoreboard

**New file**: `packages/lib/scoring/quota-metrics.ts`

- `extractStablefordTotals(scoreboard)` — sums `stableford_*` junk per player by nine (indices 0-8 / 9-17)
- `calculateQuotaSettlementMetrics(totals, quotas)` → `PlayerMetrics[]` for settlement
- `extractSkinsFromScoreboard(scoreboard)` — counts skin junk per player

**New file**: `packages/lib/scoring/__tests__/quota-metrics.test.ts`

### Step 7: Export and wire up

**Modify**: `packages/lib/scoring/index.ts` — export quota-engine and quota-metrics

---

## Key Files

| File | Action |
|------|--------|
| `packages/lib/schema/bets.ts` | NEW — Bet CoMap, ListOfBets |
| `packages/lib/schema/games.ts` | MODIFY — add `bets` field |
| `packages/lib/schema/index.ts` | MODIFY — export bets |
| `packages/lib/scoring/quota-engine.ts` | NEW — quota math |
| `packages/lib/scoring/quota-metrics.ts` | NEW — scoreboard → settlement metrics |
| `packages/lib/scoring/__tests__/quota-engine.test.ts` | NEW |
| `packages/lib/scoring/__tests__/quota-metrics.test.ts` | NEW |
| `packages/lib/scoring/pipeline.ts` | MODIFY — use_handicaps + buildPlayerQuotas |
| `packages/lib/scoring/types.ts` | MODIFY — playerQuotas on ScoringContext |
| `packages/lib/scoring/index.ts` | MODIFY — exports |
| `data/seed/options/stableford_*.json` (5) | MODIFY — based_on: gross |
| `data/seed/specs/the_big_game.json` | MODIFY — payout_pools → bets meta |

## Reused Utilities

- `calculateCourseHandicap()` from `packages/lib/utils/handicap.ts` (supports front9/back9)
- `getSpecField()` from `packages/lib/scoring/option-utils.ts`
- `extractQuotaMetrics()` from `packages/lib/scoring/settlement-engine.ts` (pattern)
- `rest_of_nine` scope pattern from `packages/lib/scoring/multiplier-engine.ts`

## What's Deferred

- Settlement UI / bet display
- Option dependency (`use_handicaps` hiding `handicap_index_from`)
- Nassau / Florida / Closeout bets
- Dynamic press creation
- PayoutPool deprecation
- Quota display in leaderboard
- Migrating existing game specs to explicit bets (they work with the implicit default)

## Verification

1. `bun tsc` — types pass
2. `bun test packages/lib/scoring/__tests__/quota-engine.test.ts`
3. `bun test packages/lib/scoring/__tests__/quota-metrics.test.ts`
4. `bun test packages/lib/scoring/` — existing tests pass
5. `./scripts/code-quality.sh`
