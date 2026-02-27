# Settlement Engine — Unified Payout System

## Status: IN PROGRESS — Phase 2a (pool-funded bridge + UI)

## Problem

The settlement engine (`packages/lib/scoring/settlement-engine.ts`) currently only handles pool-funded games (Big Game style: buy_in → pot → divide across pools). It needs to also handle zero-sum games (Five Points, Vegas, etc.: stakes × point differential, no pot). Both models should flow through the unified Bet system.

## Two Funding Models

### Pool-funded (Big Game, future Nassau)

```text
pot = buy_in × playerCount
each bet gets: pot × bet.pct / 100
within each bet: rank by metric, pay out by splitType
net position = sum(winnings across bets) - buy_in
```

- **Bounded loss**: can't lose more than buy_in
- **Example**: 48 players × $40 = $1920 pot. Front bet (25%) = $480 → 1st: $240, 2nd: $144, 3rd: $96

### Zero-sum (Five Points, Vegas, Dots, Ten/Nine Points, Match Play)

```text
no pot — direct transfers between players/teams
each point of differential = stakes dollars
net position = point_differential × stakes
sum of all net positions = $0
```

- **Unbounded loss**: governor options (discount_threshold, discount_percent) cap exposure
- **Example**: Team A beats Team B by 47 points × $1/pt = Team A wins $47, Team B loses $47

## How Bets Unify This

Every game has bets (explicit or implicit default). The settlement engine:

1. Gets the game's bets (from `game.bets` or inferred default)
2. Determines funding model (from game options: `buy_in` present → pool, `stakes` present → zero-sum)
3. For each bet, resolves scope → holes → metric value per player/team
4. Applies the bet's splitType to determine payouts
5. Aggregates across all bets → net positions → reconciled debts

### Pool settlement per bet

```text
betPool = pot × bet.pct / 100
rank players by metric within bet's scope
splitType "places" → pay top N from betPool
splitType "per_unit" → divide betPool by total units
splitType "winner_take_all" → winner gets betPool
```

### Zero-sum settlement per bet

```text
compute metric (point differential) within bet's scope
net = differential × stakes
splitType "per_unit" → each unit = stakes dollars transferred
splitType "winner_take_all" → winner gets stakes × 1 (per hole won, etc.)
```

## Scoring Metrics by Bet Type

| scoringType | Metric | How computed |
|-------------|--------|-------------|
| `quota` | stableford points - quota | `quota-metrics.ts` extracts from scoreboard + playerQuotas |
| `skins` | count of skins won | `quota-metrics.ts` counts skin junk awards |
| `points` | cumulative point total/differential | scoreboard cumulative.players.pointsTotal |
| `match` | holes won differential | scoreboard cumulative match status |

## Existing Code

- `packages/lib/scoring/settlement-engine.ts` — pool settlement (calculatePoolPayouts, calculateAllPayouts, calculateNetPositions, reconcileDebts, calculateSettlement)
- `packages/lib/scoring/settlement-engine.ts` — metric extractors (extractQuotaMetrics, extractSkinsMetric)
- `packages/lib/schema/settlement.ts` — PayoutPool, Settlement, Debt CoMaps
- `packages/lib/scoring/quota-metrics.ts` — (NEW from bets-quota-handicaps plan) stableford/quota/skins extraction

## What Needs to Be Built

### Phase 1: Zero-sum settlement engine

- [ ] Add `calculateZeroSumSettlement(bets, playerMetrics, stakes)` to settlement-engine.ts
- [ ] Handle governor (discount_threshold / discount_percent) — currently only enforced in app-0.3
- [ ] Tests for zero-sum: 2-team, 3-player, with/without governor

### Phase 2: Unified bet → settlement bridge

#### Phase 2a: Pool-funded bridge (current — #407 first pass)

New file `packages/lib/scoring/bet-settlement.ts`:
- [x] `betToPoolConfig(bet, defaultPlacesPaid)` — maps `scoringType + scope` → metric key
  - `quota + front9` → `"quota_front"`, `back9` → `"quota_back"`, `all18` → `"quota_overall"`
  - `skins + *` → `"skins_won"`
- [x] `extractMetricsForBets(bets, scoreboard, playerQuotas, players)` → `PlayerMetrics[]`
  - Calls `calculateQuotaPerformances()` for quota bets, `extractSkinCounts()` for skins bets
- [x] `settleBets(input)` → `SettlementResult` — top-level bridge function
  - Takes `{ bets, players, scoreboard, playerQuotas, buyIn, defaultPlacesPaid }`
  - Converts bets → pools, extracts metrics, calls `calculateSettlement()`
- [x] Tests in `packages/lib/scoring/__tests__/bet-settlement.test.ts`

Shared helper extracted to `packages/lib/scoring/option-utils.ts`:
- [x] `getGameOptionNumber(spec, key, fallback)` — moved from PlacesPaidScreen for reuse

App hook `packages/app/src/hooks/useSettlement.ts`:
- [x] `useSettlement(game, scoreboard, scoringContext, bets)` → `SettlementResult | null`
  - Reads buyIn + placesPaid from game.spec, playerQuotas from scoringContext
  - Returns null when buyIn=0 or no bets (non-pool-funded games)
  - Fingerprint-memoized like useScoreboard

#### Phase 2b: Zero-sum + unified dispatch (future)

- [ ] `resolveBetMetrics(bet, scoreboard, context)` — generic for all scoring types
- [ ] Handle implicit default bet for games without explicit bets
- [ ] Determine funding model from game options (`buy_in` → pool, `stakes` → zero-sum)

### Phase 3: Settlement UI (app)

#### Phase 3a: Leaderboard + Summary integration (current — #407 first pass)

Vertical leaderboard (`VerticalLeaderboard.tsx`):
- [x] Accept `netPositions?: Record<string, number> | null` prop
- [x] Append "$" column when netPositions present
- [x] Default sort: `{ columnKey: "$", direction: "desc" }` (highest payout first)
- [x] Wired from `GameLeaderboard.tsx` via `useSettlement`

Game Summary (`SummaryView.tsx`):
- [x] Accept `netPositions` prop, add "$" column
- [x] Sort by net position (descending) when payout data available
- [x] Format: "+$120", "-$40"

#### Phase 3b: Full settlement screen (future)

- [ ] Dedicated settlement results screen — per-bet breakdown, net positions, who owes whom
- [ ] Integrate with existing game screens (tab or post-round flow)

### Phase 4: Persist settlement results

- [ ] Write Settlement CoMap to game (payouts, debts, netPositions)
- [ ] Display saved settlement vs recompute on demand

## Related Files

- `packages/lib/scoring/settlement-engine.ts` — existing engine
- `packages/lib/schema/settlement.ts` — Settlement, PayoutPool, Debt schemas
- `packages/lib/schema/bets.ts` — Bet schema
- `packages/lib/scoring/quota-metrics.ts` — metric extractors
- `packages/app/src/screens/game/settings/PlacesPaidScreen.tsx` — existing payout config UI
- `data/seed/options/stakes.json` — zero-sum funding option
- `data/seed/options/buy_in.json` — pool funding option
- `data/seed/options/discount_threshold.json` — governor for zero-sum
- `data/seed/options/discount_percent.json` — governor for zero-sum
