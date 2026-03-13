# Move Jazz Operations to packages/lib

**Status:** done
**Priority:** medium — improves code sharing between app/web/cli, no urgency

## Problem

Jazz mutation logic (adding players, creating rounds, managing teams, etc.) lives
in `packages/app/src/utils/`. These are pure functions with zero React/RN
dependencies, but they can't be used by `packages/web` CLI scripts or future
consumers without duplicating logic (as seen in `populate-test-game.ts`).

## Scope

**7 files move**, **16 consuming files update imports**, **0 logic changes**.

## Migration Order (dependency-driven)

Must go bottom-up — each step depends on the previous being in place.

| Step | File | Deps on prior steps | Consumers to update |
|------|------|---------------------|---------------------|
| 1 | `teamsMode.ts` | none | 3 |
| 2 | `propagateCourseTee.ts` + test | none | 5 + test |
| 3 | `e2eCleanup.ts` | none | 1 |
| 4 | `gameTeams.ts` | step 1 | 7 |
| 5 | `createRoundForPlayer.ts` | none (reportError adapter) | 3 |
| 6 | `addPlayerToGameCore.ts` | steps 2, 4, 5 | 2 |
| 7 | `playerToPlayerData.ts` | step 6 (PlayerData type) | 0 |

## The `reportError` Problem

Two files (`addPlayerToGameCore.ts`, `createRoundForPlayer.ts`) import
`reportError` from app, which uses `react-native`'s `Platform.OS`.

**Solution:** Accept an optional error callback parameter. Default to no-op in lib.
App callers pass `reportError`, CLI callers omit it.

```typescript
// In lib — signature becomes:
export async function createRoundForPlayer(
  game: Game,
  player: Player,
  onError?: (error: unknown, context: { source: string }) => void,
): Promise<Round | null> {
```

App wrapper (thin, stays in app):
```typescript
import { createRoundForPlayer } from "spicylib/utils";
import { reportError } from "@/utils/reportError";

// Just pass reportError as the callback
createRoundForPlayer(game, player, (err, ctx) =>
  reportError(err, { source: ctx.source, severity: "error" })
);
```

## Destination Structure

```
packages/lib/
  utils/
    index.ts              # add new re-exports
    teams-mode.ts         # from app/utils/teamsMode.ts
    propagate-course-tee.ts
    e2e-cleanup.ts
    game-teams.ts
    create-round-for-player.ts
    add-player-to-game-core.ts
    player-to-player-data.ts
```

No new subpath export needed — these go into the existing `spicylib/utils` barrel.

## Import Changes (16 files)

All follow the same pattern:
```diff
- import { autoAssignPlayerToTeam } from "@/utils/gameTeams";
+ import { autoAssignPlayerToTeam } from "spicylib/utils";
```

| Consuming file | Current import source |
|----------------|----------------------|
| `hooks/useGameInitialization.ts` | `@/utils/gameTeams` |
| `hooks/useHoleInitialization.ts` | `@/utils/gameTeams` |
| `screens/game/scoring/useTeamManagement.ts` | `@/utils/gameTeams` |
| `screens/game/scoring/TeamChooserView.tsx` | `@/utils/gameTeams` |
| `components/game/settings/teams/index.tsx` | `@/utils/gameTeams`, `@/utils/teamsMode` |
| `components/game/settings/PlayerDelete.tsx` | `@/utils/gameTeams` |
| `hooks/useCreateGame.ts` | `../utils/addPlayerToGameCore` |
| `hooks/useAddPlayerToGame.ts` | `../utils/addPlayerToGameCore` |
| `screens/game/settings/AddRoundToGame.tsx` | `@/utils/createRoundForPlayer` |
| `hooks/useRoundsForDate.ts` | `@/utils/createRoundForPlayer` |
| `screens/game/settings/ManualCourseHoles.tsx` | `@/utils/propagateCourseTee` |
| `screens/game/settings/SelectCourseSearch.tsx` | `@/utils/propagateCourseTee` |
| `screens/game/settings/SelectCourseFavorites.tsx` | `@/utils/propagateCourseTee` |
| `screens/profile/DeveloperToolsScreen.tsx` | `@/utils/e2eCleanup` |
| `hooks/useTeamsMode.ts` | `@/utils/teamsMode` |
| `utils/propagateCourseTee.test.ts` | `./propagateCourseTee` |

## Payoff After Migration

- `populate-test-game.ts` can import `addPlayerToGameCore` from `spicylib/utils`
  instead of reimplementing team assignment inline
- Future web admin tools get full game mutation capabilities
- Unit tests for game logic can live in `packages/lib` (platform-independent)
- Clear separation: lib = logic, app = UI + hooks + navigation

## Risks

- **Low:** Pure file moves + import updates. No logic changes.
- **Medium:** The `reportError` adapter is a minor API change that touches 2 files.
- Each step can be committed independently and tested in isolation.

## Estimated Diff

~7 files created in lib, ~7 deleted from app, ~16 import lines updated.
Roughly 200-300 lines of diff, almost all mechanical.
