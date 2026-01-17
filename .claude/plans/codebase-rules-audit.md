# Codebase Rules Audit - PR #333 Compliance Review

## Overview

This audit reviews the codebase against the updated rules from PR #333 (commit 132b5ee), which simplified and clarified Jazz patterns, updated schema syntax to `co.map()`, and refined guidance on React hooks with Jazz data.

## Key Changes in PR #333

1. **Removed outdated patterns**: Level-by-level list loading, creating CoMaps with optional fields restrictions
2. **Simplified selectors**: Changed from complex nested `$isLoaded` checks to simple `g.$isLoaded ? g : undefined`
3. **Updated schema syntax**: Class-based `extends CoMap` → functional `co.map()` pattern
4. **Clarified ensureLoaded**: Only use after upsertUnique or for progressive deepening, NEVER to load existing instances more deeply
5. **Refined React guidance**: Clearer examples of avoiding React hooks with Jazz dependencies

---

## Violations Found

### CRITICAL: Jazz Pattern Violations

| File | Line | Issue | Recommendation |
|------|------|-------|----------------|
| `packages/app/src/components/game/settings/options/GameOptionsList.tsx` | 39 | ✅ Fixed - now stores option name string |
| `packages/app/src/navigators/GameNavigator.tsx` | 97 | ✅ Fixed - uses `[game?.$jazz.id]` |
| `packages/app/src/contexts/GameContext.tsx` | 30-67 | Deep SCORING_RESOLVE at provider level | ✅ ACCEPTABLE - Intentional design to avoid "warming up" effect. Data shared by Leaderboard + Scoring screens. useScoreboard uses fingerprint pattern to prevent recomputation. |
| `packages/app/src/components/game/settings/teams/index.tsx` | 64 | ✅ Fixed - uses `[game?.$jazz.id]` |

### HIGH: TypeScript Standard Violations

#### `any` Type Usage (11 instances)

| File | Line | Code |
|------|------|------|
| `packages/web/src/cli/jazz-inspect.ts` | 362, 396 | `Schema as any` |
| `packages/web/src/lib/user-migration.ts` | 58, 90, 115 | Migration casting |
| `packages/app/src/hooks/useCreateGame.ts` | 69 | `gameSpecs.$jazz.push(spec as any)` |
| `packages/app/src/ui/Link.tsx` | 70 | Navigation typing workaround |
| `packages/app/src/screens/games/NewGameFavorites.tsx` | 106 | `specs.$jazz.push(item as any)` |
| `packages/app/src/screens/game/settings/AddPlayerFavorites.tsx` | 126 | `players.$jazz.push(item as any)` |
| `packages/app/src/screens/game/settings/SelectCourseFavorites.tsx` | 156 | `courseTees.$jazz.push(item as any)` |

#### Default Exports (2 in active code, 4 in app-0.4 to be deleted)

| File | Line | Status |
|------|------|--------|
| `packages/app/src/components/game/GameNav.tsx` | 58 | ✅ Fixed |
| `packages/web/vite.config.ts` | 5 | N/A - Vite requires default export |
| `packages/app-0.4/src/components/TestGame.tsx` | 96 | Will be deleted |
| `packages/app-0.4/src/components/GameList.tsx` | 99 | Will be deleted |
| `packages/app-0.4/src/components/TestRound.tsx` | 55 | Will be deleted |
| `packages/app-0.4/src/components/App.tsx` | 17 | Will be deleted |

#### Type Aliases Instead of Interfaces (40+ instances)

Common locations:
- `packages/app/src/contexts/GameContext.tsx` - GameContextType, GameProviderProps
- `packages/app/src/navigators/` - Navigator param list types
- `packages/lib/types/` - Game/round/player type definitions
- `packages/api/src/lib/catalog.ts` - Data types

### HIGH: Architecture Violations

#### Business Logic in Wrong Package

| File | Lines | Issue | Status |
|------|-------|-------|--------|
| `packages/app/src/utils/gameTeams.ts` | 520+ | Team management logic | DEFERRED - Has app-specific reportError dependency |
| `packages/app/src/utils/addPlayerToGameCore.ts` | 240 | Player addition logic | DEFERRED - Has app-specific reportError dependency |
| `packages/app/src/utils/createRoundForPlayer.ts` | 80 | Round creation logic | DEFERRED - Has app-specific reportError dependency |
| `packages/app/src/utils/reportError.ts` | 48 | Error reporting | N/A - Uses React Native Platform + app constants |

**Note**: These files depend on `reportError` which uses React Native's `Platform` API and app-specific version constants. Moving to lib would require either removing error reporting or creating a dependency injection pattern for logging. This is lower priority than the Jazz pattern fixes.

#### Legacy Code to Remove

| Directory | Lines | Action |
|-----------|-------|--------|
| `packages/app-0.3/` | ~3000 | KEEP - Used for reference/comparison |
| `packages/app-0.4/` | ~4000 | ✅ DELETED |

### MEDIUM: Code Quality

#### TODOs to Track as Issues

| File | Line | TODO | Issue |
|------|------|------|-------|
| `packages/lib/schema/players.ts` | 50 | "Consider removing once all round lookups use game.rounds + playerId pattern" | ✅ [#335](https://github.com/spicygolf/spicy/issues/335) |
| `packages/app/src/utils/addPlayerToGameCore.ts` | 232 | "Remove after all callers are updated to use AddPlayerInput" | ✅ [#336](https://github.com/spicygolf/spicy/issues/336) |

---

## What's Already Compliant

### Jazz Patterns ✓
- Schema definitions use new `co.map()` pattern (not class-based)
- `$isLoaded` checks before `$jazz.set` operations
- `$jazz.has()` for optional field existence checking
- Proper `ensureLoaded` usage after upsertUnique
- Fingerprint pattern in `useScoreboard.ts` hook (exemplary)
- biome-ignore comments with proper explanations

### Architecture ✓
- Local-first: API calls only for external GHIN data
- Offline-first caching with React Query
- No enums in codebase
- Error Boundary uses class component (acceptable exception)

---

## Implementation Plan

### Phase 1: Critical Jazz Pattern Fixes (4 files)

1. **GameOptionsList.tsx** - Store option ID instead of object
   ```typescript
   // Before
   const [selectedOption, setSelectedOption] = useState<GameOption | null>(null);
   // After
   const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
   const selectedOption = useCoState(GameOption, selectedOptionId);
   ```

2. **GameNavigator.tsx** - Fix useEffect dependency
   ```typescript
   // Before
   }, [game]);
   // After
   }, [game?.$jazz.id]);
   ```

3. **GameContext.tsx** - Reduce SCORING_RESOLVE depth (requires design decision)

4. **teams/index.tsx** - Fix useMemo dependency
   ```typescript
   // Before
   }, [game]);
   // After
   }, [game?.$jazz.id]);
   ```

### Phase 2: TypeScript Standard Fixes

1. Fix `any` types in Jazz push operations (investigate proper typing)
2. Convert default exports to named exports
3. Convert type aliases to interfaces where appropriate

### Phase 3: Architecture Cleanup

1. Move business logic utilities to packages/lib:
   - gameTeams.ts
   - addPlayerToGameCore.ts
   - createRoundForPlayer.ts
   - reportError.ts

2. Delete legacy package:
   - packages/app-0.4 (app-0.3 kept for reference)

### Phase 4: Code Quality

1. Create GitHub issues for TODOs:
   - Issue: "Remove deprecated rounds field from Player schema"
   - Issue: "Remove legacy addPlayerToGame wrapper function"
2. Remove excessive comments

---

## Verification

After each phase:
```bash
bun tsc          # Type checking
bun lint         # Linting
bun format       # Formatting
./scripts/code-quality.sh  # Full quality check
```

For Jazz pattern changes, manually verify:
- No re-render storms (check React DevTools)
- Data loads correctly
- Offline functionality works

---

## Summary

| Category | Violations | Priority |
|----------|------------|----------|
| Jazz Pattern (React hooks/state) | 4 | CRITICAL |
| TypeScript `any` types | 11 | HIGH |
| Default exports | 2 (in active code) | HIGH |
| Type aliases vs interfaces | 40+ | HIGH |
| Business logic in wrong package | 4 files | HIGH |
| Legacy code to delete | 1 directory (~4000 lines) | HIGH |
| TODOs to track as issues | 2 | MEDIUM |

**Total estimated work**: 
- Phase 1: 4 files to fix
- Phase 2: ~13 files to fix (excluding app-0.4)
- Phase 3: 4 files to move + 1 directory to delete
- Phase 4: 2 GitHub issues to create
