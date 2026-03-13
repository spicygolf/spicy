# Match Leaderboard: "Bets" View for Nassau/Match Play Games

## Context

Nassau, Closeout, Match Play, and Florida Bet are **match-type** games — head-to-head match play across multiple bet scopes. They're currently tagged as `spec_type: "skins"` which is wrong and gives them the same leaderboard as stroke play. The "points" tab shows flat +1/-1/0 per hole, but doesn't show the individual bets or running match state.

**Goal**: Add a `"match"` spec_type and a new "bets" leaderboard view that shows per-bet running match state hole-by-hole from a selected player's perspective.

## UX Design

**Button group** for match games: `gross | net | bets`

**Bets view layout**:
```
[Brad Anderson ▼]           ← player/team selector

Hole | Ovr   | Front | Back | P1   | P2
  1  | 1 up  | 1 up  |      |      |
  2  | 1 up  | 1 up  |      |      |
  3  | 2 up  | 2 up  |      |      |
  4  | 2 up  | 2 up  |      |      |
  5  | 1 up  | 1 up  |      | 1 up |   ← press starts hole 5
  ...
 Out |       | W 3&2 |      | 1 up |
 10  | 1 up  |       | 1 up |      |
 ...
 In  |       |       | L 1up|      |
 Tot | W 2&1 |       |      |      |
```

- Bet columns: abbreviated names from bet `disp` field (Overall→"Ovr", Front, Back, P1, P2...)
- Empty cells for holes outside a bet's scope
- Running match state at each hole: "1 up", "2 dn", "tied"
- Clinched bets show clinch label in summary row: "W 3&2", "L 1up", "Halved"
- Colors: up=action, down=error, tied/clinched=secondary

## Implementation Steps

### Step 1: Add `"match"` spec_type

**Files**:
- `packages/lib/src/transform/types.ts:68` — extend union: `"points" | "skins" | "match"`
- `packages/app/src/hooks/useGamespecs.ts:50` — same union update
- `data/seed/specs/nassau.json` — change `"type": "skins"` → `"type": "match"`
- `data/seed/specs/matchplay.json` — change `"type": "skins"` → `"type": "match"`

### Step 2: Add `"bets"` to LeaderboardViewMode

**Files**:
- `packages/app/src/contexts/GameContext.tsx:16` — add `"bets"` to union
- `packages/app/src/screens/game/GameLeaderboard.tsx` — add match game detection + button group routing

In `GameLeaderboard.tsx`:
```
const isMatchGame = specType === "match";
// Match games: gross | net | bets
// Quota games: gross | points | skins
// Default: gross | net | points
```

### Step 3: New lib function `computePerHoleBetStates()`

**File**: `packages/lib/scoring/match-metrics.ts`

New function that returns running match state at every hole for each bet. Reuses the same `findHoleWinner` + `getHolesInScope` internals from `computeBetMatchStates`, but builds a Map<holeNumber, { diff, clinched, clinchLabel }> per bet.

```typescript
interface HoleBetState {
  diff: number;
  clinched?: boolean;
  clinchLabel?: string;
}

function computePerHoleBetStates(
  scoreboard: Scoreboard,
  bets: BetInfo[],
  playerId: string,
): Map<string, Map<string, HoleBetState>>
// Returns: betName → (holeNumber → state)
```

This avoids calling `computeBetMatchStates` 18 times (once per hole). Single pass per bet.

### Step 4: New `MatchLeaderboard` component

**File**: `packages/app/src/components/game/leaderboard/MatchLeaderboard.tsx`

Similar structure to `LeaderboardTable` but:
- **Header**: player selector dropdown + bet name columns (not player name columns)
- **Rows**: hole numbers down the left, running match state per bet in each cell
- **Summary rows**: Out/In/Total with clinch labels
- **Cell rendering**: text-based ("1 up", "2 dn", "tied") with color coding
- Takes `bets`, `scoreboard`, `playerColumns` as props
- Internal state: `selectedPlayerId`

### Step 5: Wire into GameLeaderboard

**File**: `packages/app/src/screens/game/GameLeaderboard.tsx`

When `viewMode === "bets"`, render `<MatchLeaderboard>` instead of `<LeaderboardTable>`.

### Step 6: Export from leaderboard index

**File**: `packages/app/src/components/game/leaderboard/index.ts`

Add `MatchLeaderboard` export.

## Key Functions to Reuse

- `findHoleWinner()` — `packages/lib/scoring/match-metrics.ts:47`
- `getHolesInScope()` — `packages/lib/scoring/match-metrics.ts:83`
- `extractBets()` — `packages/app/src/components/game/leaderboard/leaderboardUtils.ts`
- `getHoleRows()` — `packages/app/src/components/game/leaderboard/leaderboardUtils.ts`
- `getPlayerColumns()` — `packages/app/src/components/game/leaderboard/leaderboardUtils.ts`
- `formatDiff()` pattern from `BetMatchStates.tsx:113`
- `ScoreCell` or new `MatchCell` for rendering

## Verification

1. `bun tsc` — all packages compile
2. Existing match-metrics tests still pass
3. Add tests for `computePerHoleBetStates` — verify running state, clinch detection, press scope boundaries
4. Visual: Nassau game shows `gross | net | bets` toggle
5. Visual: "bets" view shows player selector, bet columns, running state per hole
6. Visual: press bets appear as columns only from their start hole onward
