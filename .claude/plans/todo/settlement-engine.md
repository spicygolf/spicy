# Settlement Engine — Unified Payout System

## Status: PLANNED (deferred — depends on bets-quota-handicaps)

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
- [ ] `resolveBetMetrics(bet, scoreboard, context)` — given a Bet, extract the right metric for each player/team within the bet's scope
- [ ] Handle implicit default bet for games without explicit bets
- [ ] `settleBets(game)` — top-level function: get bets, determine funding, resolve metrics, settle

### Phase 3: Settlement UI (app)
- [ ] Settlement results screen — show per-bet breakdown, net positions, who owes whom
- [ ] Integrate with existing game screens (tab or post-round flow)

### Phase 4: Persist settlement results
- [ ] Write Settlement CoMap to game (payouts, debts, netPositions)
- [ ] Display saved settlement vs recompute on demand

## Related Files

- `packages/lib/scoring/settlement-engine.ts` — existing engine
- `packages/lib/schema/settlement.ts` — Settlement, PayoutPool, Debt schemas
- `packages/lib/schema/bets.ts` — (NEW) Bet schema
- `packages/lib/scoring/quota-metrics.ts` — (NEW) metric extractors
- `packages/app/src/screens/game/settings/PlacesPaidScreen.tsx` — existing payout config UI
- `data/seed/options/stakes.json` — zero-sum funding option
- `data/seed/options/buy_in.json` — pool funding option
- `data/seed/options/discount_threshold.json` — governor for zero-sum
- `data/seed/options/discount_percent.json` — governor for zero-sum
