# Jazz Patterns

Critical Jazz Tools patterns for local-first data management in Spicy Golf.

**These patterns prevent data loss - follow them religiously.**

---

## Field Existence Checking with $jazz.has()

**Severity**: CRITICAL | **Enforcement**: BLOCKING

Use `$jazz.has("field")` NOT `!obj.field` to check if optional fields exist. Optional fields may be unloaded but exist in the database.

**Rationale**: Checking with `!obj.field` can return false for unloaded fields, leading to data loss when re-initializing them.

```typescript
// WRONG - Will cause data loss!
if (!player.rounds) {
  player.$jazz.set("rounds", ListOfRounds.create([]));
}

// CORRECT
if (!player.$jazz.has("rounds")) {
  player.$jazz.set("rounds", ListOfRounds.create([]));
}
```

---

## Prefer Resolve Queries Over ensureLoaded

**Severity**: CRITICAL | **Enforcement**: BLOCKING

Use resolve queries in `.load()` instead of shallow load + `ensureLoaded`. This is cleaner and more efficient.

**Rationale**: `ensureLoaded` is an extra step that can be avoided by specifying what you need upfront.

```typescript
// WRONG - Two-step loading
const project = await Project.load(projectId, { resolve: true });
const loadedProject = await project.$jazz.ensureLoaded({
  resolve: { tasks: { $each: true } }
});

// CORRECT - Single-step with resolve query
const project = await Project.load(projectId, {
  resolve: { tasks: { $each: true } }
});
if (!project.$isLoaded) return;
// project.tasks is now loaded
```

### Use Schema-Level Resolve Queries

Define reusable resolve queries at the schema level with `.resolved()`:

```typescript
// Define resolved schema variants
const TaskWithDescription = Task.resolved({
  description: true,
});

const ProjectWithTasks = Project.resolved({
  tasks: { $each: TaskWithDescription.resolveQuery }
});

// .load() uses the resolve query from the schema
const project = await ProjectWithTasks.load(projectId);
// Both tasks and descriptions are loaded
```

### When ensureLoaded IS Appropriate

Use `ensureLoaded` only for:
1. **After upsertUnique** - when checking optional fields on potentially new objects
2. **Migrations** - loading nested fields to check existence
3. **Progressive deepening** - when you have a shallow reference and need more

```typescript
// APPROPRIATE - After upsertUnique
player = await Player.upsertUnique({ value, unique, owner });
const loaded = await player.$jazz.ensureLoaded({ resolve: { rounds: true } });
if (!loaded.$jazz.has("rounds")) {
  // safe to initialize
}

// APPROPRIATE - Progressive deepening from existing reference
const { tracks } = await playlist.$jazz.ensureLoaded({
  resolve: PlaylistWithTracks.resolveQuery,
});
```

---

## Check $isLoaded Before Using Jazz API

**Severity**: CRITICAL | **Enforcement**: BLOCKING

Always check `obj.$isLoaded` before calling `obj.$jazz.set()`, `obj.$jazz.owner`, or other Jazz API methods.

**Rationale**: Jazz objects can be in NotLoaded state where $jazz API is not available.

```typescript
// WRONG
const root = me.root;
if (root) {
  root.$jazz.set("player", player); // ERROR: $jazz might not exist
}

// CORRECT
const root = me.root;
if (!root?.$isLoaded) {
  await root.$jazz.ensureLoaded({});
}
if (root.$isLoaded) {
  root.$jazz.set("player", player); // OK: TypeScript knows root is loaded
}
```

---

## Lazy Loading Lists Level-by-Level

**Severity**: CRITICAL | **Enforcement**: BLOCKING

When using `ensureLoaded` for progressive deepening, nested `$each` does NOT automatically load list containers at each level.

**Important distinction:**
- **Initial `.load()` or `useCoState` with resolve queries** → DOES load lists at each level correctly
- **Progressive `ensureLoaded` on already-loaded objects** → does NOT load list containers, only items if container is already loaded

**Rationale**: When progressively loading with `ensureLoaded`, nested `$each` won't load the list containers themselves. You must explicitly load each list level.

```typescript
// WRONG - $each in ensureLoaded won't load teams list if not already loaded!
await hole.$jazz.ensureLoaded({
  resolve: {
    teams: {
      $each: {
        rounds: { $each: { roundToGame: true } }
      }
    }
  }
});

// CORRECT for ensureLoaded - Load level by level
await hole.teams.$jazz.ensureLoaded({});  // Load teams list
for (const team of hole.teams) {
  await team.$jazz.ensureLoaded({});  // Load team object
  await team.rounds.$jazz.ensureLoaded({});  // Load rounds list
  for (const round of team.rounds) {
    await round.$jazz.ensureLoaded({ resolve: { roundToGame: true } });
  }
}

// CORRECT - Initial load with resolve query DOES work
const hole = await GameHole.load(holeId, {
  resolve: {
    teams: {
      $each: {
        rounds: { $each: { roundToGame: true } }
      }
    }
  }
});
// hole.teams and nested data ARE loaded
```

---

## Never Store Jazz Objects in React State

**Severity**: CRITICAL | **Enforcement**: BLOCKING

NEVER store Jazz CoValues (Game, Player, etc.) in React state (useState, useContext). Store IDs instead.

**Rationale**: Jazz objects are reactive and update references as nested data loads. Storing them in React state causes excessive re-renders (20-40+).

```typescript
// WRONG - Causes 24+ re-renders!
const [game, setGame] = useState<Game | null>(null);

useEffect(() => {
  if (game?.$isLoaded) {
    setGame(game); // Triggers re-render on every nested data load
  }
}, [game]);

// CORRECT - Store ID, use useCoState
const [gameId, setGameId] = useState<string | null>(null);

// Components use useCoState directly
const game = useCoState(Game, gameId || "", { resolve: {...} });
```

**Performance Impact**: 24+ re-renders -> 1 render (55% faster perceived loading)

---

## Avoid React Hooks with Jazz Data

**Severity**: CRITICAL | **Enforcement**: BLOCKING

Don't use useMemo, useEffect, or useCallback with Jazz CoValues as dependencies. Jazz is already reactive - just compute values directly.

**Rationale**: Jazz objects are reactive proxies. When nested data loads, the object reference doesn't change, so React dependency arrays won't trigger updates. This leads to stale computations.

```typescript
// WRONG - useMemo won't recalculate when game.players loads
const isMeInGame = useMemo(() => {
  return game?.players?.some(p => p.$jazz.id === myId);
}, [game]);  // game reference doesn't change when players load!

// CORRECT - compute directly, Jazz reactivity handles updates
const isMeInGame = (() => {
  if (!game?.$isLoaded || !game.players?.$isLoaded) return false;
  return game.players.some(p => p?.$isLoaded && p.$jazz.id === myId);
})();

// WRONG - useEffect fighting Jazz reactivity
useEffect(() => {
  if (game?.$isLoaded) {
    setPlayerCount(game.players?.length || 0);
  }
}, [game]);

// CORRECT - derive directly from Jazz data
const playerCount = game?.$isLoaded && game.players?.$isLoaded 
  ? game.players.length 
  : 0;
```

**Exception**: useMemo is OK when the dependency is a primitive derived from Jazz (like an ID array), not the Jazz object itself. See "Selectors vs useMemo" section.

---

## Keep High-Level Subscriptions Shallow

**Severity**: CRITICAL | **Enforcement**: BLOCKING

High-level components (navigators, screens) should NOT deeply resolve nested objects. Let child components load their own data.

**Rationale**: Deep resolution causes "value is unavailable" errors during progressive loading.

```typescript
// WRONG - Deep resolution in high-level screen
const { game } = useGame(undefined, {
  resolve: {
    players: {
      $each: {
        rounds: {
          $each: {
            course: { name: true },  // Too deep!
            tee: { name: true },
          },
        },
      },
    },
  },
});

// CORRECT - Shallow in parent, deep in children
const { game } = useGame(undefined, {
  resolve: {
    players: { $each: { rounds: { $each: {} } } },
  },
});

// Child component loads its own data
function RoundDetails({ round }) {
  useEffect(() => {
    if (round?.$isLoaded) {
      round.$jazz.ensureLoaded({ resolve: { course: true, tee: true } });
    }
  }, [round]);
}
```

---

## Delete vs Set Undefined for Optional Fields

**Severity**: CRITICAL | **Enforcement**: BLOCKING

Use `$jazz.delete()` to remove optional fields, NOT `$jazz.set(field, undefined)`.

**Rationale**: Setting to undefined keeps the key with undefined value. Deleting removes the key entirely.

```typescript
// WRONG - Key still exists
rtg.$jazz.set("courseHandicap", undefined);
// Result: rtg.$jazz.has("courseHandicap") = true

// CORRECT - Key is removed
rtg.$jazz.delete("courseHandicap");
// Result: rtg.$jazz.has("courseHandicap") = false
```

---

## CoRecord Map Access

**Severity**: CRITICAL | **Enforcement**: BLOCKING

For CoRecord maps (`co.record()`), use direct access `map[key]` and check null/undefined. Do NOT use `$jazz.has(key)`.

```typescript
// WRONG
if (catalogPlayers.$jazz.has(ghinId)) { ... }

// CORRECT
const player = catalogPlayers[ghinId];
if (player) {
  // Use player
}
```

---

## Use Selectors and equalityFn to Control Re-renders

**Severity**: HIGH | **Enforcement**: STRICT

Use the `select` and `equalityFn` options in useCoState to batch updates and prevent re-renders during progressive loading.

### Basic Select Pattern

```typescript
// WRONG - Re-renders 24+ times
const game = useCoState(Game, gameId, {
  resolve: { rounds: { $each: { round: { course: true } } } }
});

// CORRECT - Re-renders once when fully loaded
const game = useCoState(Game, gameId, {
  resolve: { rounds: { $each: { round: { course: true } } } },
  select: (value) => {
    if (!value.$isLoaded) return undefined;
    if (!value.rounds?.$isLoaded) return undefined;
    for (const rtg of value.rounds) {
      if (!rtg?.$isLoaded || !rtg.round?.$isLoaded) return undefined;
    }
    return value;
  }
});
```

### Select with Derived Data

Extract only the data you need to minimize re-renders:

```typescript
// Select specific fields to reduce re-render scope
const projectName = useCoState(Project, projectId, {
  select: (project) => project.$isLoaded ? project.name : undefined,
});

// Select computed values
const taskStats = useCoState(TaskList, listId, {
  resolve: { $each: true },
  select: (tasks) => {
    if (!tasks.$isLoaded) return { total: 0, completed: 0 };
    return {
      total: tasks.length,
      completed: tasks.filter(task => task.completed).length,
    };
  },
  // Custom equality to prevent re-renders when stats haven't changed
  equalityFn: (a, b) => a.total === b.total && a.completed === b.completed,
});
```

### equalityFn for Complex Data

By default, Jazz uses `Object.is` for equality. Use custom `equalityFn` for complex data:

```typescript
const game = useCoState(Game, gameId, {
  resolve: { players: { $each: { name: true } } },
  select: (game) => {
    if (!game.$isLoaded) return null;
    return {
      playerIds: game.players?.map(p => p?.$jazz.id).filter(Boolean) ?? [],
      playerCount: game.players?.length ?? 0,
    };
  },
  // Only re-render if player IDs actually change
  equalityFn: (a, b) => {
    if (!a || !b) return a === b;
    return a.playerCount === b.playerCount && 
           a.playerIds.join(',') === b.playerIds.join(',');
  },
});
```

---

## Fingerprint Pattern for Derived Data with useMemo

**Severity**: HIGH | **Enforcement**: STRICT

When you need to derive data from Jazz objects using `useMemo`, create a fingerprint of the actual values - not the Jazz object reference.

**Problem**: Jazz's progressive loading causes object references to change even when underlying data hasn't changed. Using `[game]` or `[game?.players]` as dependencies won't work correctly.

```typescript
// WRONG - Dependencies don't match actual data access
// biome-ignore lint/correctness/useExhaustiveDependencies: ... <-- RED FLAG!
const holeRows = useMemo(() => {
  if (!game) return [];
  return getHoleRows(game);  // Accesses game.rounds[0].round.tee.holes
}, [game?.rounds]);  // Doesn't capture tee.holes!

// WRONG - Jazz reference changes during progressive loading
const playerColumns = useMemo(() => {
  if (!game) return [];
  return getPlayerColumns(game);
}, [game]);  // Recalculates on every Jazz update
```

**Solution**: Create a string fingerprint from the actual values used:

```typescript
// Create fingerprint that captures the actual data being used
function createPlayerColumnsFingerprint(game: Game | null): string | null {
  if (!game?.$isLoaded || !game.players?.$isLoaded) return null;
  
  const parts: string[] = [];
  for (const player of game.players) {
    if (!player?.$isLoaded) continue;
    parts.push(`${player.$jazz.id}:${player.name ?? ""}`);
  }
  return parts.join("|");
}

function createHoleRowsFingerprint(game: Game | null): string | null {
  if (!game?.$isLoaded || !game.rounds?.$isLoaded || game.rounds.length === 0) {
    return null;
  }
  
  const firstRtg = game.rounds[0];
  if (!firstRtg?.$isLoaded) return null;
  
  const round = firstRtg.round;
  if (!round?.$isLoaded) return null;
  
  const tee = round.tee;
  if (!tee?.$isLoaded || !tee.holes?.$isLoaded) return null;
  
  const parts: string[] = [];
  for (const hole of tee.holes) {
    if (!hole?.$isLoaded) continue;
    parts.push(`${hole.number ?? ""}:${hole.par ?? ""}`);
  }
  return parts.join("|");
}

// CORRECT - Use fingerprint + useRef caching
// IMPORTANT: useMemo alone isn't enough because [fingerprint, game] means
// useMemo re-runs when game reference changes. We need refs to cache
// across those re-runs when fingerprint is unchanged.

const playerColumnsFingerprint = createPlayerColumnsFingerprint(game);
const lastPlayerColumnsFingerprint = useRef<string | null>(null);
const cachedPlayerColumns = useRef<PlayerColumn[]>([]);

const playerColumns = useMemo((): PlayerColumn[] => {
  if (!game || playerColumnsFingerprint === null) return [];
  
  // Return cached if fingerprint unchanged (game ref changed but data didn't)
  if (
    playerColumnsFingerprint === lastPlayerColumnsFingerprint.current &&
    cachedPlayerColumns.current.length > 0
  ) {
    return cachedPlayerColumns.current;
  }
  
  const result = getPlayerColumns(game);
  lastPlayerColumnsFingerprint.current = playerColumnsFingerprint;
  cachedPlayerColumns.current = result;
  return result;
}, [playerColumnsFingerprint, game]);
```

**When to use fingerprints:**
- When you need `useMemo` for expensive computations on Jazz data
- When the computation accesses nested/deep Jazz fields
- When biome complains about exhaustive dependencies

**Alternative**: Consider using Jazz's `select` option instead, which handles this automatically:

```typescript
// Alternative: Let Jazz handle it with select
const { playerColumns, holeRows } = useGame(undefined, {
  resolve: { players: { $each: { name: true } }, rounds: { $each: { round: { tee: { holes: true } } } } },
  select: (game) => {
    if (!game.$isLoaded) return { playerColumns: [], holeRows: [] };
    return {
      playerColumns: getPlayerColumns(game),
      holeRows: getHoleRows(game),
    };
  },
  equalityFn: (a, b) => 
    JSON.stringify(a.playerColumns) === JSON.stringify(b.playerColumns) &&
    JSON.stringify(a.holeRows) === JSON.stringify(b.holeRows),
});
```

---

## Modify Entities from Authoritative Source

**Severity**: HIGH | **Enforcement**: STRICT

Always modify entities from the authoritative source (e.g., game context), not from stale references.

```typescript
// WRONG - Stale reference
const { player } = route.params;
player.rounds.$jazz.push(newRound);

// CORRECT - Get fresh reference
const gamePlayer = game.players.find(p => p?.$jazz.id === player.$jazz.id);
gamePlayer.rounds.$jazz.push(newRound);
```

---

## Creating CoMaps with Optional Fields

**Severity**: HIGH | **Enforcement**: STRICT

Pass only required fields to `.create()`. Set optional fields AFTER creation.

```typescript
// WRONG - Can't pass CoMap instances in create
const scope = GameScope.create({
  holes: "all18",
  teamsConfig: someTeamsConfig,  // ERROR!
}, { owner: group });

// CORRECT
const scope = GameScope.create({ holes: "all18" }, { owner: group });
if (teamsConfig) {
  scope.$jazz.set("teamsConfig", teamsConfig);
}
```

---

## Selectors vs useMemo for Expensive Operations

**Severity**: HIGH | **Enforcement**: STRICT

Don't perform expensive computations inside selectors. Use lightweight selectors + useMemo.

```typescript
// WRONG - Expensive sorting runs on every update
select: (project) => {
  const sortedTasks = project.tasks.slice(0).sort(expensiveSort);
  return { tasks: sortedTasks };
}

// CORRECT - Lightweight selector + useMemo
select: (project) => ({
  tasks: project.tasks,
  taskIds: project.tasks.map(t => t.$jazz.id)
})

// Then in component:
const sortedTasks = useMemo(() => 
  project?.tasks.slice(0).sort(expensiveSort),
  [project?.taskIds]
);
```

---

## Performance: Load What You Need

**Severity**: MEDIUM | **Enforcement**: RECOMMENDED

Load data on-demand, not all upfront. Load current view's data, not all 18 holes.

```typescript
// WRONG - Loading all 18 holes with full data (100+ CoValue objects!)
const game = useCoState(Game, gameId, {
  resolve: {
    holes: {
      $each: {
        teams: { $each: { rounds: { $each: { roundToGame: true } } } }
      }
    }
  }
});

// CORRECT - Load current hole only
const game = useCoState(Game, gameId, {
  resolve: { holes: true, rounds: { $each: true } }
});

const currentHole = useCoState(GameHole, currentHoleId, {
  resolve: { teams: { $each: { rounds: { $each: { roundToGame: true } } } } }
});
```

---

## Jazz API Quick Reference

| Operation | Method |
|-----------|--------|
| Set optional field | `obj.$jazz.set("field", value)` |
| Delete optional field | `obj.$jazz.delete("field")` |
| Add to list | `list.$jazz.push(item)` |
| Get owner | `obj.$jazz.owner` |
| Get ID | `obj.$jazz.id` |
| Check loaded | `obj.$isLoaded` |
| Check loading state | `obj.$jazz.loadingState` |
| Check field exists | `obj.$jazz.has("field")` |

---

## Jazz CLI Inspector

Use `bun run jazz` from the project root to inspect Jazz CoValues in the database. This tool uses the worker account credentials to load and display CoValue data with proper schema typing.

### Usage

```bash
# Inspect a specific CoValue (auto-detect type)
bun run jazz co_zaYtNqJZsTyi1Sy6615uCqhpsgi

# Specify the schema type explicitly
bun run jazz player co_zndRVBmTsDPNdjNiauVfUQaMFLV
bun run jazz game co_zeGX6eUyGPUbMPdV9csYsnFczib

# Include resolve query for nested data
bun run jazz player co_zndRVBmTsDPNdjNiauVfUQaMFLV '{"rounds":{"$each":true}}'
bun run jazz game co_zeGX6eUyGPUbMPdV9csYsnFczib '{"players":{"$each":true}}'

# Inspect catalog contents
bun run jazz catalog specs     # List all game specs with teamsConfig
bun run jazz catalog players   # List players in catalog
bun run jazz catalog courses   # List courses in catalog
```

### Available Types

- `player` - Player records
- `game` - Game instances
- `round` - Round records
- `roundtogame` - Round-to-game relationships
- `course` - Golf courses
- `tee` - Tee sets
- `spec` / `gamespec` - Game specifications
- `account` - Player accounts

### Catalog Inspection

The `catalog` subcommand inspects the worker account's GameCatalog:

```bash
bun run jazz catalog specs
```

Shows all game specs with their teamsConfig details and computed `alwaysShowTeams` values.

---

## Jazz Documentation

For detailed Jazz Tools API documentation:
- https://jazz.tools/docs
- Use Context7 MCP to fetch library docs
