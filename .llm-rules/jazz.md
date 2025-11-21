# Jazz Development Rules

## Critical: Field Existence Checking

Use `$jazz.has("field")` NOT `!obj.field` to check if optional fields exist. Optional fields may be unloaded but exist in DB.

```ts
// WRONG: Overwrites existing data
if (!player.rounds) {
  player.$jazz.set("rounds", ListOfRounds.create([]));
}

// CORRECT: Checks actual existence
if (!player.$jazz.has("rounds")) {
  player.$jazz.set("rounds", ListOfRounds.create([]));
}
```

## Loading Data

### upsertUnique Pattern
After `upsertUnique`, always `ensureLoaded` before checking optional fields:

```ts
player = await Player.upsertUnique({ value, unique, owner });
const loaded = await player.$jazz.ensureLoaded({ resolve: { rounds: true } });
if (!loaded.$jazz.has("rounds")) {
  // safe to initialize
}
```

### Nested Resolution
```ts
resolve: {
  players: {
    $each: {
      rounds: { $each: true },  // loads each player + their rounds
      handicap: true,
      envs: true,
    }
  }
}
```

### ensureLoaded is async
```ts
await player.$jazz.ensureLoaded({ resolve: { rounds: true } });  // MUST await
```

### Lazy Loading with ensureLoaded

**CRITICAL: Load lists level-by-level, NOT with nested $each**

Jazz CoLists must be loaded explicitly at each level. `$each: { nested }` does NOT load list items - only resolves nested data IF items are already loaded.

```ts
// WRONG: Nested $each doesn't load the list items themselves
await hole.$jazz.ensureLoaded({
  resolve: {
    teams: {
      $each: {  // This won't load teams if they aren't loaded already!
        rounds: { $each: { roundToGame: true } }
      }
    }
  }
});

// CORRECT: Load each list explicitly, level by level
await hole.teams.$jazz.ensureLoaded({});  // Load teams list
for (const team of hole.teams) {
  await team.$jazz.ensureLoaded({});  // Load team object
  await team.rounds.$jazz.ensureLoaded({});  // Load rounds list
  for (const round of team.rounds) {
    await round.$jazz.ensureLoaded({ resolve: { roundToGame: true } });
  }
}
```

### Performance: Load What You Need

- **Initial load**: Don't include expensive nested data in `useCoState` resolve
- **On-demand**: Use `ensureLoaded()` when accessing specific tabs/features
- **Minimal depth**: Load only the nesting level you actually need

## Working with References

Always modify entities from authoritative source (e.g., game context), not stale references:

```ts
// WRONG: Stale reference
const { player } = route.params;
player.rounds.$jazz.push(newRound);

// CORRECT: Get from game context
const gamePlayer = game.players.find(p => p?.$jazz.id === player.$jazz.id);
gamePlayer.rounds.$jazz.push(newRound);
```

## API Patterns

- Set optional fields: `obj.$jazz.set("field", value)`
- Add to list: `list.$jazz.push(item)`
- Get owner: `obj.$jazz.owner`
- useState() is a code smell. Use properly-loaded Jazz data with no sync'ing to state

## Debugging Loading

Check: `$isLoaded`, `$jazz.loadingState`, `$jazz.has("field")`
- `loadingState: undefined` = Jazz hasn't tried loading yet
- `$isLoaded: false` = data not loaded or unauthorized

## Circular Dependencies

Use string IDs instead of direct references:

```ts
// Round uses playerId: z.string() instead of player: Player
// Player can have rounds: co.optional(ListOfRounds)
```

## Creating CoMaps with Optional Fields

When creating CoMaps, pass only required fields to `.create()`. Set optional fields AFTER creation:

```ts
// WRONG: Passing optional field with nested CoMap to .create() - causes "right operand of 'in' is not an object" error
const scope = GameScope.create(
  {
    holes: "all18",
    teamsConfig: someTeamsConfig,  // ERROR: Can't pass CoMap instances in initial value
  },
  { owner: group }
);

// CORRECT: Create with required fields only, then set optional fields
const scope = GameScope.create(
  {
    holes: "all18",
  },
  { owner: group }
);

// Set optional CoMap field after creation
if (teamsConfig) {
  scope.$jazz.set("teamsConfig", teamsConfig);
}
```

This is because Jazz `.create()` expects plain values, not CoMap instances, in the initial object.
