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
const player = await Player.upsertUnique({ value, unique, owner });
const loaded = await player.$jazz.ensureLoaded({ resolve: { rounds: true } });
if (!loaded.$jazz.has("rounds")) {
  // safe to initialize
}

// APPROPRIATE - Progressive deepening from existing reference
const { tracks } = await playlist.$jazz.ensureLoaded({
  resolve: PlaylistWithTracks.resolveQuery,
});
```

**NEVER** use `ensureLoaded` to load an existing CoValue instance more deeply, but to instantiate a new CoValue loaded to the correct depth.

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
if (!root.$isLoaded) {
  // THIS IS NOT RECOVERABLE. Initialize root to the required depth if appropriate, or load a new instance of root with the required depth.
  console.log('Root is not loaded:', root.$jazz.loadingState);
}
if (root.$isLoaded) {
  root.$jazz.set("player", player); // OK: TypeScript knows root is loaded
}
```

---

## Never Store Jazz Objects in React State

**Severity**: CRITICAL | **Enforcement**: BLOCKING

NEVER store Jazz CoValues (Game, Player, etc.) in React state (useState, useContext). Store IDs instead.

**Rationale**: Jazz objects are reactive and update references as nested data loads. Storing them in React state causes excessive re-renders.

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

**Performance Impact**: significant depending on the depth of the Jazz object and the number of nested data loads.

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
  if (!game.$isLoaded) return false;
  return game.players.some(p => p.$isLoaded && p.$jazz.id === myId);
})();

// WRONG - useEffect fighting Jazz reactivity
useEffect(() => {
  if (game.$isLoaded) {
    setPlayerCount(game.players.length || 0);
  }
}, [game]);

// CORRECT - derive directly from Jazz data
const playerCount = game.$isLoaded ? game.players.length 
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
    players: { $each: { rounds: { $each: true } } },
  },
});

// Child component loads its own data
function RoundDetails(props: { roundId: string }) {
  const round = useCoState(Round, props.roundId, { resolve: { course: true, tee: true } });
  // ...
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

For CoRecord maps (`co.record()`), use direct access `map[key]` and check null/undefined. Do NOT use `$jazz.has(key)` except strictly to check if a key exists.

```typescript
// WRONG
if (catalogPlayers.$jazz.has(ghinId)) { 
  // we only know that catalogPlayers has a key `ghinId`. We do not know if it's loaded/accessible/etc.
}

// CORRECT
const player = catalogPlayers[ghinId];
if (player?.$isLoaded) {
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

**Performance note**: Avoid any non-trivial computations in the `select` function.

### equalityFn for Complex Data

By default, Jazz uses `Object.is` for equality. Use custom `equalityFn` for complex data:

```typescript
const game = useCoState(Game, gameId, {
  resolve: { players: { $each: { name: true } } },
  select: (game) => {
    if (!game.$isLoaded) return null;
    return {
      playerIds: game.players.map(p => p.$jazz.id).filter(Boolean) ?? [],
      playerCount: game.players.length ?? 0,
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

---

## Modify Entities from Authoritative Source

**Severity**: HIGH | **Enforcement**: STRICT

Always modify entities from the authoritative source (e.g., game context), not from stale references.

```typescript
// WRONG - Stale reference
const { player } = route.params;
player.rounds.$jazz.push(newRound);

// CORRECT - Get fresh reference
const gamePlayer = game.players.find(p => p.$jazz.id === player.$jazz.id);
gamePlayer.rounds.$jazz.push(newRound);
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

## Never Subscribe Per List Item

**Severity**: CRITICAL | **Enforcement**: BLOCKING

Never call `useCoState` or `useGame` inside a component rendered once per list item (e.g., inside a FlatList `renderItem`). Each call creates a separate Jazz SubscriptionScope. With N items, you get N redundant subscriptions to the same (or overlapping) data.

**Real-world impact**: A 48-player game with `useGame()` per player item created 102 concurrent subscriptions, 384 renders, and multi-second hangs.

### Pattern: Subscribe Once in Parent, Pass Data Down

```typescript
// WRONG — 48 components × 1 useGame() each = 48 subscriptions
function PlayerListItem({ player }: { player: Player }) {
  const { game } = useGame(undefined, {
    resolve: { rounds: { $each: { round: { playerId: true } } } },
  });
  const rtg = game?.rounds?.find(r => r.round?.playerId === player.$jazz.id);
  return <Text>{rtg?.handicapIndex}</Text>;
}

// CORRECT — 1 subscription in parent, data passed as props
function PlayerList() {
  const { game } = useGame(undefined, {
    resolve: { rounds: { $each: { round: { playerId: true } } } },
  });

  // Build lookup once
  const rtgByPlayer = new Map<string, RoundToGame>();
  if (game?.$isLoaded && game.rounds?.$isLoaded) {
    for (const rtg of game.rounds) {
      if (rtg?.$isLoaded && rtg.round?.$isLoaded && rtg.round.playerId) {
        rtgByPlayer.set(rtg.round.playerId, rtg);
      }
    }
  }

  return (
    <FlatList
      data={players}
      renderItem={({ item }) => (
        <PlayerListItem player={item} roundToGame={rtgByPlayer.get(item.$jazz.id)} />
      )}
    />
  );
}

// Child is now subscription-free
function PlayerListItem({ player, roundToGame }: Props) {
  return <Text>{roundToGame?.handicapIndex}</Text>;
}
```

### Pattern: On-Demand ensureLoaded for Mutations

When a child component needs deep data only for a rare user action (e.g., "delete player"), don't maintain a persistent subscription. Use `$jazz.ensureLoaded` on-demand.

```typescript
// WRONG — persistent deep subscription per item, just for delete
function PlayerDelete({ player }: { player: Player }) {
  const { game } = useGame(undefined, {
    resolve: {
      holes: { $each: { teams: { $each: { rounds: { $each: { roundToGame: true } } } } } },
    },
  });
  // ... delete logic using game
}

// CORRECT — parent provides callback, loads deep data on tap
function PlayerList() {
  const { game } = useGame(undefined, { resolve: { players: true, rounds: true } });

  const handleDelete = useCallback(async (player: Player) => {
    if (!game?.$isLoaded) return;
    // Load deep team data ONLY when user taps delete
    const loaded = await game.$jazz.ensureLoaded({
      resolve: {
        holes: { $each: { teams: { $each: { rounds: { $each: { roundToGame: true } } } } } },
      },
    });
    deletePlayerFromGame(loaded, player);
  }, [game]);

  return <FlatList renderItem={({ item }) => <PlayerDelete player={item} onDelete={handleDelete} />} />;
}

// Child is now a simple button — no hooks, no subscriptions
function PlayerDelete({ player, onDelete }: { player: Player; onDelete: (p: Player) => void }) {
  return <TouchableOpacity onPress={() => onDelete(player)}><Icon name="delete" /></TouchableOpacity>;
}
```

---

## Throttle Expensive Derived Computations

**Severity**: HIGH | **Enforcement**: STRICT

When deriving expensive computations from Jazz data (scoring engines, complex aggregations), **never use synchronous `useMemo`**. Jazz progressive loading and external mutations (CLI scripts, other devices) can fire hundreds of rapid updates. A synchronous computation blocks the JS thread on every update.

**Real-world impact**: A scoring engine (80-250ms per run) inside `useMemo` ran 186 times during a bulk delete, blocking the JS thread for 30+ seconds and crashing the app.

### Pattern: Throttled useEffect with Fingerprint

```typescript
const THROTTLE_MS = 300;

function useExpensiveDerivation(game: Game | null): Result | null {
  const [result, setResult] = useState<Result | null>(null);
  const lastFingerprintRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fingerprint: cheap hash of scoring-relevant data
  const fingerprint = createFingerprint(game);

  useEffect(() => {
    if (fingerprint === null) {
      if (lastFingerprintRef.current !== null) {
        lastFingerprintRef.current = null;
        setResult(null);
      }
      return;
    }
    if (fingerprint === lastFingerprintRef.current) return;

    const isFirst = lastFingerprintRef.current === null;
    const compute = () => {
      const scored = expensiveComputation(game);
      lastFingerprintRef.current = fingerprint;
      setResult(scored);
    };

    if (isFirst) {
      compute(); // No delay for initial load
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        compute();
      }, THROTTLE_MS);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [fingerprint, game]);

  return result;
}
```

**Key properties:**
- First computation is immediate (no delay on initial load)
- Subsequent changes get a 300ms cooldown; timer resets on new changes
- Collapses rapid mutation storms into a single re-computation
- Uses numeric fingerprint (cyrb53 hash) for fast comparison

---

## Bulk Jazz Mutations Cause Render Storms

**Severity**: HIGH | **Enforcement**: AWARENESS

Every Jazz CoValue mutation (splice, set, delete) syncs immediately to all subscribers. When a script or function mutates many CoValues in a loop (e.g., deleting scores one by one), each mutation triggers a re-render in any component subscribed to that data.

**Real-world impact**: `deepDeleteGame` splicing 200+ scores/rounds/teams caused 186 re-scores at 80-250ms each, crashing the app.

### Mitigation Strategies

1. **Throttle derived computations** (see above) — most important defense
2. **Remove references first, then deep-delete** — unsubscribe the app before the mutation storm:
   ```typescript
   // Remove game from organizer's list FIRST (app unsubscribes)
   games.$jazz.splice(gameIndex, 1);
   await pause(1000); // Let sync propagate
   // THEN deep-delete internals (no one is listening)
   await deepDeleteGame(game);
   ```
3. **Batch where possible** — use a single `splice` with replacement array instead of individual operations:
   ```typescript
   // WRONG — N individual mutations = N sync events
   for (const key of keysToDelete) {
     scores.$jazz.delete(key);
   }

   // BETTER — single splice replaces entire list
   const filtered = list.filter(item => shouldKeep(item));
   list.$jazz.splice(0, list.length, ...filtered);
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
