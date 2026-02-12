# Tee Flip Redesign: Confirmation Dialog, Earliest-Hole-Only, Per-Game Option

## Context

The current tee flip auto-pops a spinning animation whenever the score is tied. Problems:
- Fires on every tied hole, even when scores are cleared/re-entered
- Hardcoded — no way to disable per game
- Auto-fires rather than asking the user if they want to flip
- Wording is game-specific (Five Points says "presses", others say "the cube")

Current branch (`feat/game-tee-time-370`) already has two good fixes:
- TeeFlipModal unmounts when not visible (prevents render oscillation)
- `isTeeFlipRequired` returns false when scoreboard is null (prevents premature modal during progressive loading)

This plan covers the **next phase** on a new branch.

## Design

### 1. New gamespec option: `tee_flip`

**Seed option**: `data/seed/options/tee_flip.json`
```json
{
  "name": "tee_flip",
  "disp": "Tee flip",
  "type": "game",
  "valueType": "text",
  "defaultValue": ""
}
```

- Value is the per-game label text (e.g. `"Flip for presses"`)
- Empty string = tee flip disabled for this game
- **Add to Five Points**: `data/seed/specs/five_points.json` → `options` array gets `"tee_flip"` with default `"Flip for presses"`
- Import updated seed data by running the web package

### 2. i18n — minimal, slug-based

One translation key for the dialog trigger phrase:
- Key: `tee_flip_trigger` → `"Score is tied"` (en_US)
- The per-game option text comes from the gamespec value (e.g. `"Flip for presses"`)
- Dialog reads: **"Score is tied — Flip for presses?"** (trigger + option text)

Follow whatever minimal i18n pattern exists (JSON file for error messages). Add a similar JSON or co-locate with tee flip code.

### 3. Confirmation dialog flow

Replace the auto-show `useEffect` in `ScoringView.tsx`:

**When** `teeFlipRequired && !teeFlipWinner && !teeFlipDeclined && teeFlipEnabled && isEarliestUnflippedHole`:
- Show Alert: *"{tee_flip_trigger} — {option text}?"* → Yes / No
- **Yes** → `setTeeFlipMode("flip")` → spinning tee animation
- **No** → store `tee_flip_declined` TeamOption in Jazz → both teams get multiplier buttons, no blocking

### 4. Declined state (Jazz TeamOption)

Store `tee_flip_declined` as a TeamOption (like `tee_flip_winner`):
- Persists across app restarts
- `getTeeFlipDeclined(allTeams, currentHoleNumber)` helper alongside existing `getTeeFlipWinner`
- When declined: `teeFlipBlocksTeam = false` for both teams, multiplier buttons show normally

### 5. Earliest-untouched-hole-only rule

Only auto-prompt on the **first hole in `holesList` order** where:
- `isTeeFlipRequired` is true (score is tied)
- No `tee_flip_winner` AND no `tee_flip_declined` for that hole

Later tied holes still show `teeFlipRequired === true` (replay icon, multiplier blocking), but do NOT auto-pop. User navigates there and can manually trigger.

**New helper**: `isEarliestUnflippedHole(scoreboard, holesList, currentHoleIndex, gameHoles)` — scans from start of `holesList` to find first tied hole without a result.

### 6. `isTeeFlipRequired` stays as-is

Pure "is the score tied?" check. New logic (enabled, earliest-hole, declined) composes in `ScoringView.tsx`.

## Files to modify

| File | Change |
|------|--------|
| `data/seed/options/tee_flip.json` | New option definition |
| `data/seed/specs/five_points.json` | Add `tee_flip` to options |
| `packages/app/src/screens/game/scoring/ScoringView.tsx` | Confirmation dialog, earliest-hole logic, declined state |
| `packages/app/src/screens/game/scoring/scoringUtils.ts` | `isEarliestUnflippedHole`, `getTeeFlipDeclined`, `recordTeeFlipDeclined` |
| `packages/app/src/screens/game/scoring/__tests__/teeFlipUtils.test.ts` | Tests for new helpers |
| i18n file (TBD — find existing pattern) | `tee_flip_trigger` key |

## Seed data import

Run the web package to import updated seed data into Jazz.
