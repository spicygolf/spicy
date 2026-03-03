# Bet Options Refactor

> Move bets from stringified JSON in meta options to a first-class option type, and model press behavior as game options.

## Status: Phases 1-4 DONE, Phase 5 deferred

**Branch**: `refactor/bet-options`
**Completed**: 2026-03-03

## Motivation

The Big Game stores bets as a JSON string inside a `meta` option (`valueType: "text"`). This is:
- No schema validation — just a string until parsed
- Not extensible for press rules (Nassau, Closeout, Florida Bet)
- Inconsistent with how other scoring constructs (junk, multiplier) are modeled

Nassau (#124), Closeout (#414), and Florida Bet (#414) need both static initial bets AND dynamic press behavior. The option system is the right extensibility mechanism.

## Two Settlement Models

| Model | Games | How money works |
|-------|-------|----------------|
| **Pool** | The Big Game | Buy-in → pot → split by `pct` |
| **Stakes** | Nassau, Closeout, Florida Bet | Each bet has a fixed `amount`, paid between players/teams directly |

## Design

### 1. New option type: `"bet"`

Individual seed files in `data/seed/options/`, referenced by specs like junk/multiplier.

**Pool-style example** (`front_quota.json`):
```json
{
  "name": "front_quota",
  "disp": "Front",
  "type": "bet",
  "scope": "front9",
  "scoringType": "quota",
  "splitType": "places",
  "pct": 25
}
```

**Stakes-style example** (`front_match.json`):
```json
{
  "name": "front_match",
  "disp": "Front",
  "type": "bet",
  "scope": "front9",
  "scoringType": "match",
  "splitType": "winner_take_all",
  "amount": 10
}
```

**Common fields**: `name`, `disp`, `type`, `scope`, `scoringType`, `splitType`
**Pool games**: `pct` (percentage of pot)
**Stakes games**: `amount` (fixed dollar value per bet)

### 2. Press behavior via game options

Most already exist:

| Option | Type | Purpose | Status |
|--------|------|---------|--------|
| `auto_press` | game/bool | Enable automatic pressing | **exists** |
| `auto_press_trigger` | game/num | "2-down auto" threshold | **exists** |
| `press_scope` | game/menu | `same` / `rest_of_nine` / `rest_of_round` | **created** |
| `press_amount_rule` | game/menu | `fixed` / `double` | **created** |
| `max_presses` | game/num | Cap on presses (optional) | **created** |

### 3. Specs reference bet options by name

```json
{
  "_key": "the_big_game",
  "bets": ["front_quota", "back_quota", "overall_quota", "skins_all"],
  "game": ["buy_in", "places_paid"]
}
```

```json
{
  "_key": "nassau",
  "bets": ["front_match", "back_match", "overall_match"],
  "game": ["stakes", "auto_press", "auto_press_trigger", "press_scope"]
}
```

```json
{
  "_key": "closeout",
  "bets": ["all_match"],
  "game": ["stakes", "auto_press", "auto_press_trigger", "press_scope", "max_presses"]
}
```

```json
{
  "_key": "florida_bet",
  "bets": ["all_match"],
  "game": ["stakes", "auto_press", "auto_press_trigger", "press_scope", "press_amount_rule"]
}
```

Nassau's "10/10/20" = three bet options with `amount: 10`, `amount: 10`, `amount: 20`.
Florida Bet vs Closeout = same bet option, different `press_amount_rule` game option (`"double"` vs `"fixed"`).

### 4. Settlement engine fork

- **Pool path**: `totalPot = buyIn * playerCount`, each bet gets `pot * pct / 100`, split by `splitType`
- **Stakes path**: each bet is worth its `amount × playerCount`, uses same payout split logic

The `settleBets()` function determines path based on whether bets have `pct` or `amount`.

### 5. Runtime: no change to Game.bets

The `Bet` CoMap schema already has the right shape. `amount` added as optional field alongside existing `pct` (now also optional). `ListOfBets` on `Game` continues to be the live bet state — initial bets materialized at game creation, presses appended during play.

### `overall_match` vs `all_match`

Two separate bet option seeds exist:
- **`overall_match`** — Nassau's "overall" bet (default $20, the big bet in the 10/10/20 pattern)
- **`all_match`** — Closeout/Florida Bet's single match bet (default $10)

Same shape, different default amounts. Could be consolidated via per-spec overrides, but separate seeds make intent clearer.

## Implementation Steps

### Phase 1: Bet option type in the pipeline — DONE

1. Add `BetOptionSchema` to `packages/lib/schema/options.ts`
2. Add `SeedBetOption` interface to `packages/api/src/utils/seed-loader.ts`
3. Add `BetOptionData` interface to `packages/api/src/lib/catalog.ts`
4. Wire through the seed-option pipeline (all 7 layers per seed-option-pipeline skill)
5. Create bet option seed files for The Big Game's 4 bets
6. Add `bets` array to spec seed files (referencing bet options by name)
7. Update `loadSeedSpecsAsV03()` / `importSpecFromSeed()` to handle `bets` array
8. Remove the stringified JSON `meta` option for bets from `the_big_game.json`

### Phase 2: Game creation reads bet options — DONE

9. Update `createBetsFromSpec()` in `useCreateGame.ts` to read from bet options instead of parsing meta JSON
10. Add `amount` field to `Bet` CoMap schema (`packages/lib/schema/bets.ts`)

### Phase 3: Settlement engine supports stakes model — DONE

11. Add stakes settlement path to `settleBets()` / `calculateSettlement()`
12. Route based on `pct` vs `amount` on the bet configs

### Phase 4: New game option seed files for press behavior — DONE

13. Create `press_scope.json` (game/menu: same, rest_of_nine, rest_of_round)
14. Create `press_amount_rule.json` (game/menu: fixed, double)
15. Create `max_presses.json` (game/num)

### Phase 5: Press mechanics — DEFERRED to #124/#414

16. App-side press action: reads game options, creates new `Bet` CoMap, appends to `Game.bets`
17. Auto-press detection: monitors match state, triggers press when `auto_press_trigger` threshold met

## Resolved Questions

- **Bet option overrides in specs**: YES — same pattern as junk/multiplier overrides. `upsertGameSpec()` already supports per-spec pct/amount overrides. User changes in Game Settings will override at the game instance level.
- **Press inherits or references parent bet?**: YES — add `parentBetName` field to Bet CoMap when implementing Phase 5. Follow the multiplier invalidation pattern: if a retroactive score edit removes the condition that triggered the press, the press bet should be invalidatable (like multiplier invalidation_reason).
- **Nassau amount notation**: Each bet has its own `amount` field on the bet option. "10/10/20" = three seed options with amount 10, 10, 20. A shorthand UI chooser (or saved favorite combos) can come later as UI sugar.

## Notes for #124 (Nassau) and #414 (Closeout/Florida Bet)

When implementing these tickets, the foundation is in place:

### What's ready
- `type: "bet"` option fully wired through schema → seed → transform → catalog pipeline
- 8 bet option seeds exist: `front_match`, `back_match`, `overall_match`, `all_match`, `front_quota`, `back_quota`, `overall_quota`, `skins_all`
- Stakes settlement engine: `settleBets()` auto-routes pool vs stakes based on `pct` vs `amount`
- Press game options created: `press_scope`, `press_amount_rule`, `max_presses`
- Nassau spec updated with bets and press options
- `createBetsFromSpec()` reads bet options from spec with legacy JSON fallback

### What still needs doing (Phase 5)
- **Match play scoring type**: The `scoringType: "match"` needs a metric extractor in `extractMetricsForBets()` — currently only `quota` and `skins` extractors exist
- **Press creation UI**: Button/action in the app to create a press bet mid-round
- **Auto-press detection**: Monitor match state per-hole, trigger when `auto_press_trigger` threshold met
- **Press bet Bet CoMap**: Add `parentBetName: z.optional(z.string())` to Bet schema for tracking press lineage
- **Press invalidation**: Follow multiplier invalidation pattern — if a retroactive edit removes the triggering condition, mark the press as invalid
- **Closeout/Florida Bet spec seeds**: Create `closeout.json` and `florida_bet.json` spec seeds (the bet/option seeds already exist)
