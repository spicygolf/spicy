# Implement Nassau Game (#124)

## Context

Nassau is a three-bet match play game (front 9, back 9, overall 18) with stakes-based settlement and auto/manual press bets. The bet-options refactor (#418) built most of the infrastructure: bet option seeds, Nassau spec, stakes settlement engine, press game options. What remains is match play metric extraction for settlement, the leaderboard view mode, and press mechanics.

**Key decisions from discussion:**
- Match play scoring already exists in `calculateMatchPlay()` (cumulative stage) for 2-team games. Nassau starts `teams: false` but can flip to `true` (like Match Play spec). When teams, use lowest score (best ball).
- `stakes` game option stays for per-point-differential games (Five Points, Wolf, etc.) — their settlement model is fundamentally different from fixed-pool bets. Nassau uses bet `amount` (already set up in #418).
- The `next_ball_breaks_ties` option exists but is untested in new code — it's an option, not a blocker.
- Leaderboard should show match state labels ("2 up", "1 dn", "tied", "3 & 2") like app-0.3.

## Steps

### Step 1: Match play metric extractor for settlement

Create `packages/lib/scoring/match-metrics.ts` — extracts "holes won" per player/team from the scoreboard for settlement.

**For individual games** (`teams: false`): Compare `PlayerHoleResult.net` per hole. Sole lowest net wins the hole (+1). Ties halved (no points).

**For team games** (`teams: true`): Read existing `TeamHoleResult.holeNetTotal` / `runningTotal` computed by `calculateMatchPlay()` in cumulative.ts. The match play engine already determines hole winners for 2-team games.

**Functions:**
- `extractMatchMetrics(scoreboard)` → `Map<id, { front, back, total }>` — works for both player and team IDs
- `extractMatchMetricsForScope(scoreboard, scope, startHoleIndex?)` → `Map<id, holesWon>` — for dynamic press scopes

Split by play-order nines, align to physical course sides for shotgun starts (same pattern as `calculateQuotaPerformances` in `quota-metrics.ts`).

**Tests** in `packages/lib/scoring/__tests__/match-metrics.test.ts`:
- 2-player individual: clear winner, split front/back, all ties
- 4-player individual: only sole lowest net wins
- 2-team: reads from existing team match play results
- Shotgun start alignment
- Dynamic scope (rest_of_nine from index 4)

**Files:**
- `packages/lib/scoring/match-metrics.ts` (NEW)
- `packages/lib/scoring/__tests__/match-metrics.test.ts` (NEW)
- `packages/lib/scoring/index.ts` (add exports)

### Step 2: Wire match metrics into settlement + fix WTA ties

**`packages/lib/scoring/bet-settlement.ts`:**
- Remove `match` from unsupported filter (line 269-276) — only reject `points`
- Import and call `extractMatchMetrics()` in `extractMetricsForBets()` when `scoringTypes.has("match")`
- Populate `match_front`, `match_back`, `match_overall` metric keys
- Extend `BetConfig.scope` to include `rest_of_nine | rest_of_round`
- Add `startHoleIndex?: number` to `BetConfig`
- For dynamic-scope press bets, use `extractMatchMetricsForScope()` with unique metric keys

**`packages/lib/scoring/settlement-engine.ts`:**
- Fix `winner_take_all` case (line 248-265): use `rankWithTies` to detect tied leaders, split pool evenly (currently first player wins ties arbitrarily — bad for halved matches)

**Tests:**
- Update `stakes-settlement.test.ts`: change "throws for match" test → match settlement works. Add 2-player and 4-player Nassau tests with net-score-based match scoring
- Add WTA tie-splitting test to settlement engine tests

**Files:**
- `packages/lib/scoring/bet-settlement.ts`
- `packages/lib/scoring/settlement-engine.ts`
- `packages/lib/scoring/__tests__/stakes-settlement.test.ts`

### Step 3: Wire stakes settlement through the app

**`packages/app/src/hooks/useSettlement.ts`:**
- Fix guard on line 42: `buyIn <= 0` blocks Nassau. Allow settlement when `bets.some(b => b.amount > 0)` regardless of buyIn
- Pass `amount` and `startHoleIndex` through to `BetConfig`
- For stakes bets, don't set fallback `pct` (line 60 currently forces `pct: 100 / validBets.length`)
- Extend `VALID_SCOPES` to include `rest_of_nine`, `rest_of_round`

**`packages/app/src/components/game/leaderboard/leaderboardUtils.ts`:**
- Add `amount?: number` and `startHoleIndex?: number` to `BetColumnInfo` interface
- Update `extractBets()` to include `amount` and `startHoleIndex` from Bet CoMap

**Files:**
- `packages/app/src/hooks/useSettlement.ts`
- `packages/app/src/components/game/leaderboard/leaderboardUtils.ts`

### Step 4: Match view mode in leaderboard

Add match state display following app-0.3 patterns ("2 up", "1 dn", "tied", "3 & 2").

**`packages/app/src/components/game/leaderboard/leaderboardUtils.ts`:**
- Add `"match"` to `ViewMode` type
- `getVerticalColumns()`: set `viewModeOverride: "match"` for `scoringType === "match"` bets
- `getSummaryValue()`: add `"match"` branch — for individual games, count holes where player has sole lowest net in scope; for team games, read from `TeamHoleResult.matchDiff` / cumulative match results
- `getScoreToPar()`: return null for match mode
- Add match state formatting helper: `formatMatchState(diff, matchOver)` → "2 up" / "1 dn" / "tied" / "3 & 2"

**Reference:** `packages/app-0.3/src/common/utils/score.js` lines 787-800 for v0.3 formatting logic.

**Files:**
- `packages/app/src/components/game/leaderboard/leaderboardUtils.ts`

### Step 5: Add `parentBetName` to Bet schema + press creation logic

**`packages/lib/schema/bets.ts`:**
- Add `parentBetName: z.optional(z.string())`

**New: `packages/lib/scoring/press.ts`:**
- `createPressBet(config)` → pure function returning press bet properties
  - Name: `"press_1_front_match"`, disp: `"Press 1 (Front)"`
  - Amount: fixed = parent amount, double = 2× previous press
  - Scope: same / rest_of_nine / rest_of_round based on game option
- `checkAutoPress(scoreboard, bets, existingPresses, currentHoleIndex, trigger, maxPresses)` → list of presses that should fire
  - For each non-press match bet, compute match state through current hole
  - If any player is down by >= trigger holes, and no existing press at this hole for this parent → shouldPress: true
  - Respect maxPresses cap (0 = unlimited)

**Tests** in `packages/lib/scoring/__tests__/press.test.ts`:
- Press name/amount/scope generation
- Fixed vs double amount rules
- Auto-press trigger at 2-down
- Max presses cap, no duplicate at same hole

**Files:**
- `packages/lib/schema/bets.ts`
- `packages/lib/scoring/press.ts` (NEW)
- `packages/lib/scoring/__tests__/press.test.ts` (NEW)
- `packages/lib/scoring/index.ts` (add exports)

### Step 6: App-side press hooks and UI

**New: `packages/app/src/hooks/useAutoPress.ts`:**
- Watches scoreboard changes
- Reads game options (auto_press, auto_press_trigger, press_scope, press_amount_rule, max_presses)
- Calls `checkAutoPress()`, creates Bet CoMaps, appends to `game.bets`
- Exposes `createManualPress(parentBetName, currentHoleIndex)` for manual press button
- Uses ref to track created presses (prevent duplicates across renders)

**Leaderboard:**
- `getVerticalColumns()`: handle dynamic scopes for press columns
- Press bets auto-appear as columns when appended to `game.bets`

**Scoring view:**
- Add "Press" button when game has match bets
- Calls `createManualPress` from hook

**Files:**
- `packages/app/src/hooks/useAutoPress.ts` (NEW)
- `packages/app/src/components/game/leaderboard/leaderboardUtils.ts`
- `packages/app/src/screens/game/scoring/GameScoring.tsx`

## Deferred
- Press invalidation on retroactive score edits (follow multiplier invalidation pattern)
- Closeout / Florida Bet specs (#414) — same infrastructure, different press_amount_rule
- Five Points convergence to bet model (different settlement semantics: per-point differential vs fixed pool)
- `next_ball_breaks_ties` testing (option exists, untested in new code)

## Verification
1. `bun tsc` — no type errors across all 4 packages
2. `bun test` — all existing + new tests pass
3. `./scripts/code-quality.sh` — lint/format clean
4. Manual: create Nassau game (individual), score holes, verify leaderboard shows holes won and $ payouts
5. Manual: flip to teams, verify team match play works
6. Manual: verify auto-press fires at 2-down, press column appears in leaderboard

## Key Files
| File | Role |
|------|------|
| `packages/lib/scoring/match-metrics.ts` | NEW — match metric extraction |
| `packages/lib/scoring/press.ts` | NEW — press creation + auto-press detection |
| `packages/lib/scoring/bet-settlement.ts` | Wire match metrics, extend BetConfig, remove match guard |
| `packages/lib/scoring/settlement-engine.ts` | Fix WTA tie splitting |
| `packages/lib/schema/bets.ts` | Add parentBetName |
| `packages/app/src/hooks/useSettlement.ts` | Support stakes games (buyIn guard fix) |
| `packages/app/src/hooks/useAutoPress.ts` | NEW — auto/manual press hook |
| `packages/app/src/components/game/leaderboard/leaderboardUtils.ts` | Match view mode, BetColumnInfo extensions |
| `packages/lib/scoring/stages/cumulative.ts` | Existing match play engine (READ, reuse for teams) |
| `packages/lib/scoring/quota-metrics.ts` | Pattern to follow for match-metrics |
