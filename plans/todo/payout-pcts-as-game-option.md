# Payout Percentages as a Game Option

## Status: PROPOSED

## Background

### What exists today

Payout percentages are split across two disconnected mechanisms:

1. **`places_paid` game option** — a menu option (`data/seed/options/places_paid.json`) with choices "2", "3", "4", "5". Stored in `game.spec["places_paid"]` as a `GameOption` with `valueType: "menu"`. The display strings bake in the default percentages (e.g., `"4 (45/27/18/10)"`).

2. **`DEFAULT_PAYOUT_PCTS`** — a hardcoded `Record<number, number[]>` in `settlement-engine.ts` mapping place count → percentage array. This is the authoritative source for the actual numbers (covers 1–10 places).

3. **`game.payoutPools`** — a Jazz `ListOfPayoutPools` on the Game CoMap. Each `PayoutPool` has an optional `payoutPcts: co.list(z.number())`. The `PlacesPaidScreen` writes custom percentages here at the game level. The settlement engine reads them via `useSettlement` → `betToPoolConfig` → `PoolConfig.payoutPcts`.

### What went wrong (and was fixed on this branch)

The payout percentage story had 6 bugs across the stack — all now fixed on `feat/group-tee-time-picker`:

1. **No payout pools existed.** The Big Game spec had no `payout_pools` meta option, so `createPayoutPoolsFromSpec()` produced an empty list. `PlacesPaidScreen.saveToJazz` iterated zero pools — saves silently dropped. **Fix:** Create a pool on the fly when none with `splitType === "places"` exists.

2. **Stale closure.** `handlePctChange` captured `pcts` from `useCallback` closure. Rapid edits overwrote each other. **Fix:** `pctsRef` updated immediately, each edit builds on the ref.

3. **setState during render.** First fix called `saveToJazz` inside a `setPcts` functional updater. Jazz's `$jazz.set()` propagated through `ScoringProvider`, triggering "Cannot update component while rendering another." **Fix:** Moved save outside the updater.

4. **Static display labels.** Game Settings "Options" tab showed `"4 (45/27/18/10)"` from the seed JSON's `choices[].disp` — never reflected custom pcts. **Fix:** Read from `game.payoutPools` and compute display dynamically, falling back to `DEFAULT_PAYOUT_PCTS`.

5. **Settlement ignored custom pcts.** `useSettlement` set `payoutPcts: undefined` on every bet config. The engine always fell back to defaults. **Fix:** Added `defaultPayoutPcts` to `SettleBetsInput`, read from pool in `useSettlement`, threaded through `betToPoolConfig` → `PoolConfig.payoutPcts` → `calculatePoolPayouts`.

6. **Missing resolve.** `SCORING_RESOLVE` didn't include `payoutPools`, so `game.payoutPools` was always `undefined` on leaderboard/scoring screens. **Fix:** Added to resolve.

### Why this is still fragile

Even with the fixes, the architecture is awkward:

- **Spec-level defaults require editing `DEFAULT_PAYOUT_PCTS`** in TypeScript code. A group that always uses 60/25/15 for 3 places can't set that in their spec — they have to manually edit every game.
- **Two storage locations** for the same concept: `places_paid` (number of places) lives in the spec option, while `payoutPcts` (the actual percentages) lives in `game.payoutPools` — a completely separate data structure.
- **The `payout_pools` meta option** (JSON string) was designed for multi-pool splits (front/back/skins each with their own %) but is overloaded for simple "how many places get paid." For The Big Game's bet-based model, pools are derived from bets, not from this meta option.
- **Display strings are stale** — the menu choices show fixed text like "4 (45/27/18/10)". We patched GameOptionsList to compute dynamic labels, but the underlying option definition still has stale `disp` strings.

## Proposal: Make Payout Percentages a First-Class Game Option

### Goal

A spec can define default payout percentages (per group/club preferences), and a game organizer can override them per game — using the same mechanism as every other game option.

### Design

#### New option: `payout_pcts`

A new game option type that stores the full payout percentage array, not just the place count.

**Seed file** (`data/seed/options/payout_pcts.json`):
```json
{
  "name": "payout_pcts",
  "disp": "Payout Percentages",
  "type": "game",
  "version": "1",
  "valueType": "int_array",
  "defaultValue": [50, 30, 20]
}
```

Uses a new `valueType: "int_array"` with a native JSON array. The number of places is implicit in the array length — no separate `places_paid` needed. Requires adding `"int_array"` to the `GameOptionSchema` valueType enum, plus a `valueArray` field (or reuse `defaultValue` as `number[]`).

**Per-game override**: `PlacesPaidScreen` writes the array directly to `game.spec["payout_pcts"]`.

#### Migration path

1. **Keep `places_paid` temporarily** — existing games reference it. New games use `payout_pcts`.
2. **Read fallback chain**: `payout_pcts` value → `DEFAULT_PAYOUT_PCTS[places_paid]` (no more payoutPools in the chain).
3. **PlacesPaidScreen** writes to `payout_pcts` spec option directly.
4. **Settlement engine** reads from `payout_pcts` option, falls back to `DEFAULT_PAYOUT_PCTS`.
5. **Remove `payoutPools` field from Game schema** and all related code (`createPayoutPoolsFromSpec`, pool reads in `useSettlement`, resolve additions).
6. **Eventually** deprecate `places_paid` and `DEFAULT_PAYOUT_PCTS`.

### Decisions

1. **`valueType: "int_array"`** — Add a new valueType to `GameOptionSchema`. Cleaner than comma-separated text, gives us proper type safety through the schema and seed loader. Touches `GameOptionSchema` Zod validation, seed loader, and catalog pipeline.

2. **Per-bet overrides: yes, eventually.** The game-level `payout_pcts` serves as the default. Individual bets can override with their own payout pcts. This fits the future bets management screens (needed for Nassau bet amount editing too — #424). Design the option so per-bet overrides layer on top cleanly.

3. **Remove `payoutPools` from Game schema.** The spec option should be the single source of truth. No more dual storage. This simplifies the read/write path and eliminates the class of bugs fixed on this branch.

4. **Spec override mechanism: keep it simple.** Use the existing spec option mechanism (specs reference options by name, web admin can edit values). No new `option_overrides` pattern needed. Future per-player/season defaults (#424) are a separate effort.

5. **No preset choices.** The option row displays the current payout percentages array (e.g., "45 / 27 / 18 / 10"). Tapping opens the percentage editor (PlacesPaidScreen) directly — stepper for place count, input fields for each percentage.

## Steps (rough — refine before implementing)

| # | Step | Notes |
|---|------|-------|
| 1 | Add `int_array` valueType to `GameOptionSchema` | New Zod field for array values |
| 2 | Add `payout_pcts` seed option JSON | `valueType: "int_array"`, default [50,30,20] |
| 3 | Add to seed loader + catalog pipeline | Follow seed-option-pipeline checklist |
| 4 | Add `payout_pcts` to Big Game spec | Default [45,27,18,10] |
| 5 | Update `PlacesPaidScreen` to read/write `payout_pcts` | Write to spec option, not payoutPools |
| 6 | Update settlement engine read path | Read from `payout_pcts` option, fall back to `DEFAULT_PAYOUT_PCTS` |
| 7 | Update `GameOptionsList` display | Show array as "45 / 27 / 18 / 10" |
| 8 | Remove `payoutPools` from Game schema | Delete field, `createPayoutPoolsFromSpec`, pool reads, resolve additions |
| 9 | Re-import specs via web admin | Pick up new option |
| 10 | Test end-to-end | Spec defaults → per-game override → settlement |
| 11 | Clean up `places_paid` and `DEFAULT_PAYOUT_PCTS` | After migration validated |

## Related Files

- `data/seed/options/places_paid.json` — current option (to be superseded)
- `packages/lib/scoring/settlement-engine.ts` — `DEFAULT_PAYOUT_PCTS`, `getPayoutPcts()`
- `packages/lib/scoring/bet-settlement.ts` — `betToPoolConfig()`, `settleBets()`
- `packages/lib/scoring/option-utils.ts` — `getGameOptionNumber()`
- `packages/lib/schema/options.ts` — `GameOptionSchema`, `GameOption`
- `packages/lib/schema/settlement.ts` — `PayoutPool`, `ListOfPayoutPools`
- `packages/app/src/hooks/useSettlement.ts` — reads pcts for settlement
- `packages/app/src/hooks/useCreateGame.ts` — `createPayoutPoolsFromSpec()`
- `packages/app/src/screens/game/settings/PlacesPaidScreen.tsx` — UI editor
- `packages/app/src/screens/game/settings/GameOptionsList.tsx` — display in options list
- `packages/api/src/utils/seed-loader.ts` — seed → catalog pipeline
- `packages/api/src/lib/catalog.ts` — option import/override
