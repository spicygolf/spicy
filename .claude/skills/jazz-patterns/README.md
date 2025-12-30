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

Jazz CoLists must be loaded explicitly at each level. Nested `$each` does NOT load list items.

**Rationale**: Common misconception that `$each` loads the list. It doesn't - you must explicitly load each list level.

```typescript
// WRONG - $each won't load teams if they aren't loaded already!
await hole.$jazz.ensureLoaded({
  resolve: {
    teams: {
      $each: {
        rounds: { $each: { roundToGame: true } }
      }
    }
  }
});

// CORRECT - Load level by level
await hole.teams.$jazz.ensureLoaded({});  // Load teams list
for (const team of hole.teams) {
  await team.$jazz.ensureLoaded({});  // Load team object
  await team.rounds.$jazz.ensureLoaded({});  // Load rounds list
  for (const round of team.rounds) {
    await round.$jazz.ensureLoaded({ resolve: { roundToGame: true } });
  }
}
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

## Use Selectors to Control Re-renders

**Severity**: HIGH | **Enforcement**: STRICT

Use the `select` option in useCoState to batch updates and prevent re-renders during progressive loading.

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

## Jazz Documentation

For detailed Jazz Tools API documentation:
- https://jazz.tools/docs
- Use Context7 MCP to fetch library docs
