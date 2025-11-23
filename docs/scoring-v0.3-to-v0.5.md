# Spicy Golf v0.3 Scoring Engine Analysis & v0.5 Recommendations

**Date**: 2025-11-21  
**Purpose**: Document how v0.3 scoring works and provide architectural recommendations for v0.5

---

## Table of Contents
1. [How v0.3 Scoring Works](#how-v03-scoring-works)
2. [Data Model Analysis](#data-model-analysis)
3. [Architectural Recommendations for v0.5](#architectural-recommendations-for-v05)
4. [Performance Patterns](#performance-patterns)
5. [Testing Strategy](#testing-strategy)

---

## How v0.3 Scoring Works

### Entry Point: `scoring()` Function
**Location**: `/packages/app-0.3/src/common/utils/score.js`

The `scoring()` function is a **monolith** that handles all game scoring logic. It processes:
- Hole-by-hole scores
- Team assignments
- Junk (dots/side bets) - can this be called Adders (vs. multipliers)?  I guess junk is fine...
- Multipliers
- Rankings and points allocation

### Core Flow

```
scoring(game) 
  ↓
1. Get all junk options from gamespec
2. Get all multiplier options from gamespec  
3. Initialize scoreboard structure
4. FOR EACH HOLE:
   ├─ Calculate gross/net scores per player
   ├─ Assign players to teams (rotating or fixed)
   ├─ Calculate team scores (best ball, scramble, etc.)
   ├─ Rank teams (with tie handling)
   ├─ Award junk based on logic expressions
   ├─ Apply multipliers based on availability expressions
   ├─ Calculate points using JSON Logic
   └─ Update running totals
5. Return scoreboard with per-hole and cumulative data
```

### Data Structures

#### Input: `game` object
```javascript
{
  _key: "123",
  name: "Ten Points",
  holes: [{hole: "1", teams: [...], multipliers: [...]}],
  rounds: [{
    _key: "r1",
    player: [{_key: "p1", ...}],
    scores: [{hole: "1", gross: "4", pops: "0"}],
    tees: [{holes: [{number: 1, par: 4, allocation: 10}]}]
  }],
  gamespecs: [{
    _key: "gs1",
    options: [{type: "num", name: "stakes", default: "1"}],
    junk: [{type: "dot", name: "birdie", value: 1, logic: "..."}],
    multipliers: [{name: "double", value: 2, availability: "..."}]
  }],
  options: [{name: "stakes", values: [{value: "1", holes: ["1","2",...]}]}],
  scope: {holes: "all18", teams_rotate: "true"}
}
```

#### Output: `scoreboard` object
```javascript
{
  holes: {
    "1": {
      players: {
        "p1": {
          gross: 4,
          net: 4,
          pops: 0,
          rank: 1,
          junk: [{name: "birdie", value: 1}],
          multipliers: [],
          points: 5
        }
      },
      teams: {
        "1": {
          players: ["p1", "p2"],
          score: 4,
          rank: 1,
          points: 5,
          junk: [{name: "low_ball", value: 1}],
          multipliers: [{name: "double", value: 2}]
        }
      }
    }
  },
  cumulative: {
    players: {"p1": {points: 45, junk: [...], multipliers: [...]}},
    teams: {"1": {points: 50, junk: [...], multipliers: [...]}}
  }
}
```

### Key Algorithms

#### 1. Team Assignment
**Code**: `addPlayerToOwnTeam()` in `/packages/app-0.3/src/common/utils/game.js`

For rotating teams (e.g., Wolf, partners change each hole):
```javascript
// Player assignment rotates based on hole number
const teamNum = getTeamForHole(playerIndex, holeIndex, totalPlayers);
```

For fixed teams:
```javascript
// Teams set at game start, no rotation
teams = game.scope.teams; // Fixed for entire game
```

#### 2. Ranking with Ties
**Pattern**: Used throughout for determining winners

```javascript
// Returns array of ranks handling ties
// Input: [4, 3, 3, 5] → Output: [2, 1, 1, 3]
const ranks = getRanksWithTies(scores, better); 
// 'better' = "lower" for golf scores
```

The ranking algorithm:
1. Sort scores by value
2. Assign same rank to tied scores
3. Skip ranks after ties (e.g., two-way tie for 1st → next is 3rd)

#### 3. Junk Award Logic (JSON Logic)
**Pattern**: Declarative logic expressions evaluated at runtime

Example - "Birdie" junk:
```json
{
  "name": "birdie",
  "type": "dot",
  "value": 1,
  "score_to_par": "exactly -1",
  "based_on": "gross",
  "scope": "player"
}
```

Evaluated as:
```javascript
if (player.gross === par - 1) {
  awardJunk(player, "birdie", 1);
}
```

Example - "Outright Winner" (complex logic):
```json
{
  "name": "outright_winner",
  "type": "dot",
  "value": 5,
  "logic": "{'rankWithTies': [1, 1]}",
  "scope": "team"
}
```

Evaluated as:
```javascript
// Award if team rank is 1 and count of teams at rank 1 is exactly 1
if (team.rank === 1 && teamsAtRank1.length === 1) {
  awardJunk(team, "outright_winner", 5);
}
```

#### 4. Multiplier Availability (JSON Logic)
**Pattern**: Conditional multipliers based on game state

Example - "Pre-Double" multiplier:
```json
{
  "name": "pre_double",
  "value": 2,
  "scope": "rest_of_nine",
  "availability": "{
    'team_down_the_most': [
      {'getPrevHole': []},
      {'var': 'team'}
    ]
  }"
}
```

Evaluated as:
```javascript
// Available if this team was down the most on previous hole
const prevHole = game.holes[holeIndex - 1];
const losingTeam = getTeamDownTheMost(prevHole);
if (losingTeam === currentTeam) {
  enableMultiplier(currentTeam, "pre_double", 2, "rest_of_nine");
}
```

#### 5. Points Calculation (JSON Logic + Stableford-style)
**Pattern**: Points awarded based on rank and ties

Ten Points example:
- Outright winner: 5 points
- 2-way tie for 1st: 4 points each
- 3-way tie for 1st: 3 points each
- 2nd place (all different): 3 points
- 2-way tie for 2nd: 2 points each
- Last place: 1 point

Implementation:
```javascript
// JSON Logic expressions check rank patterns
const pointsLogic = [
  {condition: "{'rankWithTies': [1, 1]}", points: 5}, // Outright 1st
  {condition: "{'rankWithTies': [1, 2]}", points: 4}, // 2-way tie 1st
  {condition: "{'rankWithTies': [1, 3]}", points: 3}, // 3-way tie 1st
  {condition: "{'rankWithTies': [2, 1]}", points: 3}, // Alone in 2nd
  {condition: "{'rankWithTies': [2, 2]}", points: 2}, // 2-way tie 2nd
  {condition: "{'rankWithTies': [3, 1]}", points: 1}, // DFL
];

const basePoints = evaluatePointsLogic(team.rank, rankCounts, pointsLogic);
const junkPoints = team.junk.reduce((sum, j) => sum + j.value, 0);
const multiplier = team.multipliers.reduce((prod, m) => prod * m.value, 1);
const totalPoints = (basePoints + junkPoints) * multiplier;
```

### Critical Performance Notes

1. **Per-Hole Iteration**: The entire scoring function runs O(holes × players × teams) operations
2. **Repeated Queries**: Game data is passed in, not fetched, so it's relatively efficient
3. **JSON Logic Overhead**: Each junk/multiplier evaluates a logic expression per hole/player
4. **State Dependencies**: Later holes depend on earlier holes for cumulative totals and "previous hole" logic
5. **No Caching**: Every re-render recalculates everything from scratch

---

## Data Model Analysis

### v0.3 Evolution: From Embedded to Graph

You were in the middle of refactoring from **embedded arrays** to **graph-based relationships**:

#### Original Model (Still in JSON files)
```json
{
  "gamespec": {
    "options": [{type: "num", name: "stakes"}],
    "junk": [{type: "dot", name: "birdie"}],
    "multipliers": [{name: "double", value: 2}]
  }
}
```

#### Intended Graph Model (Partially implemented)
```
(gamespec) --[game2gamespec]--> (game)
(gamespec) --[option2gamespec]--> (option)
(option) has: {type, sub_type, name, value, default, availability, logic}
```

### Your Consolidation Idea: ✅ YES, Great Track!

**Consolidating to `options` with `type` and `sub_type` is the right move.**

Here's why:
1. **Single query path**: Fetch all options in one go
2. **Unified interface**: Same CRUD operations for all option types
3. **Easier filtering**: `WHERE type = 'junk'` vs separate tables/collections
4. **Future extensibility**: Add new types without schema changes
5. **Type safety**: TypeScript discriminated unions work beautifully

#### Recommended Schema for v0.5

```typescript
// Core option type with discriminated union
type OptionBase = {
  id: string;
  name: string;
  disp: string;
  seq: number;
  scope: 'player' | 'team' | 'hole' | 'rest_of_nine' | 'game';
  show_in?: 'score' | 'faves' | 'none';
  icon?: string;
};

type GameOption = OptionBase & {
  type: 'game';
  sub_type: 'num' | 'bool' | 'menu' | 'pct';
  default: string | number | boolean;
  choices?: {name: string; disp: string}[];
};

type JunkOption = OptionBase & {
  type: 'junk';
  sub_type: 'dot' | 'skin' | 'carryover';
  value: number;
  limit?: 'one_per_group' | 'one_team_per_group';
  based_on: 'gross' | 'net' | 'user';
  score_to_par?: string; // e.g., "exactly -1"
  calculation?: 'logic' | 'best_ball' | 'aggregate';
  logic?: JsonLogicExpression;
  better?: 'lower' | 'higher';
};

type MultiplierOption = OptionBase & {
  type: 'multiplier';
  sub_type?: 'bbq' | 'press' | 'automatic';
  value: number;
  based_on?: string; // Reference to junk name, e.g., "birdie"
  availability?: JsonLogicExpression;
  override?: boolean;
};

type Option = GameOption | JunkOption | MultiplierOption;

// Graph edges
type GamespecOption = {
  gamespec_id: string;
  option_id: string;
  enabled: boolean; // Allow enabling/disabling without deletion
  custom_values?: OptionValue[]; // Override default values
};

type GameOption = {
  game_id: string;
  option_id: string;
  values: OptionValue[]; // Player-specific settings per hole
};

type OptionValue = {
  value: string | number | boolean;
  holes: string[]; // Which holes this value applies to
};
```

### Graph Structure Recommendation

```
┌──────────────┐
│  GameSpec    │
│  (template)  │
└──────┬───────┘
       │
       │ gamespec2option (many-to-many)
       │ {enabled: true, custom_values: [...]}
       ↓
┌──────────────┐
│   Option     │────────┐
│ (reusable)   │        │
└──────────────┘        │
       ↑                │
       │                │ References for logic
       │                │ e.g., multiplier based_on: "birdie"
       └────────────────┘

┌──────────────┐
│     Game     │
│  (instance)  │
└──────┬───────┘
       │
       │ game2gamespec (inherits options)
       │
       ↓
       │ game2option (overrides)
       │ {values: [{value: 2, holes: ["1","2"]}]}
       ↓
    (Option)
```

**Benefits**:
1. **Reusable options**: "Birdie" junk can be shared across gamespecs
2. **Composition**: Mix and match options to create new game variants
3. **Versioning**: Update option logic without affecting old games
4. **Player customization**: Override option values per game
5. **Efficient queries**: Single traversal to get all options

---

## Grafting Graph Model onto Jazz Tools

### Jazz Tools Overview

**Jazz Tools** is a local-first sync framework with:
- **CoMaps**: Collaborative maps (like documents/objects)
- **CoLists**: Collaborative lists (ordered collections)
- **Automatic sync**: Changes sync across devices when online
- **Offline-first**: Everything works offline, syncs when reconnected
- **Schema validation**: Uses Zod for type-safe schemas

### Current Jazz Schema (v0.5)

```typescript
// From packages/lib/schema/games.ts
const Game = co.map({
  start: z.date(),
  name: z.string(),
  scope: GameScope,
  specs: ListOfGameSpecs,      // CoList of GameSpec references
  holes: ListOfGameHoles,       // CoList of GameHole CoMaps
  players: ListOfPlayers,       // CoList of Player references
  rounds: ListOfRoundToGames,   // CoList of RoundToGame edges
});

// From packages/lib/schema/gamespecs.ts
const GameSpec = co.map({
  name: z.string(),
  short: z.string(),
  version: z.number(),
  status: z.literal(["prod", "dev", "test"]),
  spec_type: z.literal(["points", "skins"]),
  min_players: z.number(),
  location_type: z.literal(["local", "virtual"]),
  teamsConfig: co.optional(TeamsConfig),
});

// From packages/lib/schema/rounds.ts
const RoundToGame = co.map({
  round: Round,                 // Reference to Round CoMap
  handicapIndex: z.string(),
  courseHandicap: z.optional(z.number()),
  gameHandicap: z.optional(z.number()),
});
```

### Challenge: Simulating Graph Relationships in Jazz

**The Problem**: Jazz Tools doesn't have native graph traversal like ArangoDB. We need to simulate graph-like relationships using **references** and **CoLists**.

**The Solution**: Use CoMap references + CoLists to create bidirectional "edges".

### Recommended Jazz Schema for Options

#### 1. Option CoMap (The Vertices)

```typescript
// packages/lib/schema/options.ts
import { co, z } from "jazz-tools";

// Base schema for all options
const OptionBase = {
  name: z.string(),
  disp: z.string(),
  seq: z.number(),
  scope: z.literal(['player', 'team', 'hole', 'rest_of_nine', 'game']),
  show_in: z.optional(z.literal(['score', 'faves', 'none'])),
  icon: z.optional(z.string()),
};

// Game settings options
export const GameOption = co.map({
  ...OptionBase,
  type: z.literal(['game']),
  sub_type: z.literal(['num', 'bool', 'menu', 'pct']),
  default: z.string(), // Store as string, parse as needed
  choices: z.optional(z.array(z.object({
    name: z.string(),
    disp: z.string(),
  }))),
});
export type GameOption = co.loaded<typeof GameOption>;

// Junk (dots/side bets) options
export const JunkOption = co.map({
  ...OptionBase,
  type: z.literal(['junk']),
  sub_type: z.literal(['dot', 'skin', 'carryover']),
  value: z.number(),
  limit: z.optional(z.literal(['one_per_group', 'one_team_per_group'])),
  based_on: z.literal(['gross', 'net', 'user']),
  score_to_par: z.optional(z.string()), // e.g., "exactly -1"
  calculation: z.optional(z.literal(['logic', 'best_ball', 'aggregate'])),
  logic: z.optional(z.string()), // JSON.stringify(jsonLogicExpression)
  better: z.optional(z.literal(['lower', 'higher'])),
});
export type JunkOption = co.loaded<typeof JunkOption>;

// Multiplier options
export const MultiplierOption = co.map({
  ...OptionBase,
  type: z.literal(['multiplier']),
  sub_type: z.optional(z.literal(['bbq', 'press', 'automatic'])),
  value: z.number(),
  based_on: z.optional(z.string()), // Name of junk option, e.g., "birdie"
  availability: z.optional(z.string()), // JSON.stringify(jsonLogicExpression)
  override: z.optional(z.boolean()),
});
export type MultiplierOption = co.loaded<typeof MultiplierOption>;

// Union type for TypeScript
export type AnyOption = GameOption | JunkOption | MultiplierOption;

// Lists
export const ListOfGameOptions = co.list(GameOption);
export const ListOfJunkOptions = co.list(JunkOption);
export const ListOfMultiplierOptions = co.list(MultiplierOption);
```

#### 2. GameSpec with Options (The Edges)

```typescript
// Updated packages/lib/schema/gamespecs.ts
import { co, z } from "jazz-tools";
import { ListOfGameOptions, ListOfJunkOptions, ListOfMultiplierOptions } from "./options";

export const GameSpec = co.map({
  name: z.string(),
  short: z.string(),
  long_description: z.string().optional(),
  version: z.number(),
  status: z.literal(["prod", "dev", "test"]),
  spec_type: z.literal(["points", "skins"]),
  min_players: z.number(),
  location_type: z.literal(["local", "virtual"]),
  teamsConfig: co.optional(TeamsConfig),
  
  // Options owned by this gamespec (composition)
  gameOptions: ListOfGameOptions,
  junkOptions: ListOfJunkOptions,
  multiplierOptions: ListOfMultiplierOptions,
});
export type GameSpec = co.loaded<typeof GameSpec>;
```

#### 3. Game with Option Overrides

```typescript
// Updated packages/lib/schema/games.ts
import { co, z } from "jazz-tools";

// Option value override for a game
export const GameOptionValue = co.map({
  optionName: z.string(),      // Reference by name (simpler than ID)
  value: z.string(),            // The override value
  holes: z.array(z.string()),   // Which holes this applies to
});
export type GameOptionValue = co.loaded<typeof GameOptionValue>;

export const ListOfGameOptionValues = co.list(GameOptionValue);

export const Game = co.map({
  start: z.date(),
  name: z.string(),
  scope: GameScope,
  specs: ListOfGameSpecs,
  holes: ListOfGameHoles,
  players: ListOfPlayers,
  rounds: ListOfRoundToGames,
  
  // Option overrides for this specific game instance
  optionOverrides: ListOfGameOptionValues,
});
export type Game = co.loaded<typeof Game>;
```

### Graph Traversal Pattern in Jazz

Since Jazz doesn't have graph queries, we traverse manually:

```typescript
// Get all options for a game
function getAllOptionsForGame(game: Game): AnyOption[] {
  const allOptions: AnyOption[] = [];
  
  // Traverse all gamespecs
  for (const gamespec of game.specs) {
    // Collect game options
    for (const opt of gamespec.gameOptions) {
      allOptions.push({
        ...opt,
        type: 'game' as const,
        gamespec_id: gamespec.id,
      });
    }
    
    // Collect junk options
    for (const opt of gamespec.junkOptions) {
      allOptions.push({
        ...opt,
        type: 'junk' as const,
        gamespec_id: gamespec.id,
      });
    }
    
    // Collect multiplier options
    for (const opt of gamespec.multiplierOptions) {
      allOptions.push({
        ...opt,
        type: 'multiplier' as const,
        gamespec_id: gamespec.id,
      });
    }
  }
  
  return allOptions;
}

// Apply game-specific overrides
function getOptionsWithOverrides(game: Game): AnyOption[] {
  const baseOptions = getAllOptionsForGame(game);
  
  // Build override map
  const overrideMap = new Map<string, GameOptionValue[]>();
  for (const override of game.optionOverrides) {
    if (!overrideMap.has(override.optionName)) {
      overrideMap.set(override.optionName, []);
    }
    overrideMap.get(override.optionName)!.push(override);
  }
  
  // Apply overrides
  return baseOptions.map(opt => {
    const overrides = overrideMap.get(opt.name);
    if (!overrides) return opt;
    
    return {
      ...opt,
      values: overrides.map(o => ({
        value: o.value,
        holes: o.holes,
      })),
    };
  });
}
```

### Performance Considerations with Jazz

#### 1. Local-First = Fast Reads

**Good News**: All data is local, so reads are instant (no network latency).

```typescript
// This is FAST - all local
const game = await Game.load(gameId);
const options = getAllOptionsForGame(game);
const scoreboard = score(game); // Pure computation, no I/O
```

#### 2. Lazy Loading Can Be Slow

**Problem**: Jazz CoMaps can be lazy-loaded, causing waterfalls.

```typescript
// BAD: Triggers multiple lazy loads
for (const gamespec of game.specs) {
  for (const opt of gamespec.gameOptions) { // Load gamespec
    console.log(opt.name); // Load each option
  }
}

// GOOD: Ensure loaded upfront, check resolve query argument in ensureLoaded
await ensureLoaded(game.specs);
await Promise.all(
  game.specs.map(gs => ensureLoaded(gs.gameOptions))
);

// Now traverse without lazy loads
for (const gamespec of game.specs) {
  for (const opt of gamespec.gameOptions) {
    console.log(opt.name);
  }
}
```

#### 3. Denormalization for Speed

**Pattern**: Cache computed data in Game CoMap for instant access.

```typescript
// Add cached scoreboard to Game
export const Game = co.map({
  // ... existing fields
  
  // Cached scoreboard (updated when scores change)
  cachedScoreboard: z.optional(z.string()), // JSON.stringify(scoreboard)
  scoreboardVersion: z.number(), // Increment to invalidate cache
});

// Scoring with cache
function scoreWithCache(game: Game): Scoreboard {
  // Check if cache is valid
  const currentVersion = computeScoreVersion(game);
  if (game.scoreboardVersion === currentVersion && game.cachedScoreboard) {
    return JSON.parse(game.cachedScoreboard);
  }
  
  // Compute fresh
  const scoreboard = score(game);
  
  // Update cache (async, don't block)
  updateGameCache(game, scoreboard, currentVersion);
  
  return scoreboard;
}

function computeScoreVersion(game: Game): number {
  // Hash of all scores + options
  let hash = 0;
  for (const round of game.rounds) {
    for (const score of round.round.scores) {
      hash = (hash * 31 + parseInt(score.gross)) >>> 0;
    }
  }
  return hash;
}
```

#### 4. Reactive Updates with Jazz

**Pattern**: Use Jazz's built-in reactivity for live scoring.

```typescript
// In React component
function Leaderboard({ gameId }: { gameId: ID<Game> }) {
  const { game } = useCoState(Game, gameId, {
    rounds: [{ round: { scores: [] } }], // Deep load
  });
  
  // Recompute scoreboard whenever game changes
  const scoreboard = useMemo(() => {
    if (!game) return null;
    return scoreWithCache(game);
  }, [game]);
  
  // Jazz automatically triggers re-render when scores change!
  return <LeaderboardView scoreboard={scoreboard} />;
}
```

### Measuring Performance

**Benchmark Suite**:

```typescript
import { performance } from 'perf_hooks';

async function benchmarkJazzScoring() {
  const game = await createTestGame({
    players: 4,
    holes: 18,
    junkOptions: 10,
    multiplierOptions: 5,
  });
  
  // Measure cold start (with lazy loads)
  const coldStart = performance.now();
  await ensureFullyLoaded(game);
  const scoreboard1 = score(game);
  const coldTime = performance.now() - coldStart;
  
  // Measure warm (everything loaded)
  const warmStart = performance.now();
  const scoreboard2 = score(game);
  const warmTime = performance.now() - warmStart;
  
  // Measure incremental update
  game.rounds[0].round.scores[0].gross = "5"; // Change one score
  const incrementalStart = performance.now();
  const scoreboard3 = scoreIncremental(game, scoreboard2);
  const incrementalTime = performance.now() - incrementalStart;
  
  console.log({
    coldStart: `${coldTime.toFixed(2)}ms`,
    warm: `${warmTime.toFixed(2)}ms`,
    incremental: `${incrementalTime.toFixed(2)}ms`,
  });
}

// Expected results:
// coldStart: 50-100ms (lazy loads)
// warm: 5-10ms (pure computation)
// incremental: 1-3ms (only recalc affected holes)
```

**Target Performance** (on iPhone 12+):
- Cold start: < 100ms
- Warm scoring: < 10ms
- Incremental update: < 5ms
- UI update: < 16ms (60fps)

### Alternative: Separate Option Library

If performance becomes an issue, consider a **global option library**:

```typescript
// Global option registry (not in game data)
export const OptionRegistry = co.map({
  gameOptions: ListOfGameOptions,
  junkOptions: ListOfJunkOptions,
  multiplierOptions: ListOfMultiplierOptions,
});

// GameSpec just references option names
export const GameSpec = co.map({
  // ... other fields
  enabledOptionNames: z.array(z.string()),
});

// Resolution
function getOptionsForGameSpec(
  gamespec: GameSpec,
  registry: OptionRegistry
): AnyOption[] {
  const allOptions = [
    ...registry.gameOptions,
    ...registry.junkOptions,
    ...registry.multiplierOptions,
  ];
  
  return allOptions.filter(opt => 
    gamespec.enabledOptionNames.includes(opt.name)
  );
}
```

**Trade-offs**:
- ✅ **Pro**: Single source of truth for options
- ✅ **Pro**: Easy to update logic globally
- ✅ **Pro**: Smaller game documents
- ❌ **Con**: Extra lookup step
- ❌ **Con**: Versioning is harder (changing option affects all games)

**Recommendation**: Start with **embedded options in GameSpec**. Only move to registry if performance measurements show it's needed.

### Migration Strategy

1. **Add option schemas** to Jazz (week 1)
2. **Populate test data** in app initialization (week 1)
3. **Run parallel scoring** (v0.3 ArangoDB vs v0.5 Jazz) (week 2)
4. **Benchmark** with realistic data (week 2)
5. **Optimize hot paths** based on measurements (week 3)
6. **Cut over** to Jazz-only (week 4)

### Nothing is Sacred

**You're right - everything is fair game for modification!**

If performance measurements show issues, we can:
- Denormalize data (cache scoreboards)
- Pre-compute rankings
- Flatten option lists
- Add indexes (via lookup maps)
- Use Web Workers for computation
- Whatever it takes to hit < 10ms scoring

**Measure first, optimize second.**

---

## Architectural Recommendations for v0.5

### 1. Break Up the Monolith: Functional Pipeline

**Current Problem**: The `scoring()` function does everything in one giant loop.

**Solution**: Decompose into a **functional pipeline** with **pure functions**.

#### Recommended Architecture: Context + Stages

```typescript
// Context: Immutable data passed through pipeline
type ScoringContext = {
  game: Game;
  gamespec: GameSpec;
  options: Option[];
  junk: JunkOption[];
  multipliers: MultiplierOption[];
  holes: Hole[];
  rounds: Round[];
  tees: Tee[];
  // Computed data
  teamsPerHole: Map<string, Team[]>; // Hole ID → Teams
  scoresPerHole: Map<string, PlayerScore[]>; // Hole ID → Scores
  // Results (built up through pipeline)
  scoreboard: Scoreboard;
};

// Pipeline stages (pure functions)
type Stage = (ctx: ScoringContext) => ScoringContext;

// Main scoring pipeline
const scoringPipeline: Stage[] = [
  initializeScoreboard,
  calculateGrossScores,
  calculatePops,
  calculateNetScores,
  assignTeams,
  calculateTeamScores,
  rankPlayers,
  rankTeams,
  awardJunk,
  applyMultipliers,
  calculatePoints,
  calculateCumulatives,
];

export function score(game: Game): Scoreboard {
  const initialContext = buildContext(game);
  const finalContext = scoringPipeline.reduce(
    (ctx, stage) => stage(ctx),
    initialContext
  );
  return finalContext.scoreboard;
}
```

#### Example Stages

```typescript
// Stage 1: Calculate gross scores
function calculateGrossScores(ctx: ScoringContext): ScoringContext {
  const scoresPerHole = new Map();
  
  for (const hole of ctx.holes) {
    const holeScores = ctx.rounds.flatMap(round => 
      round.scores
        .filter(s => s.hole === hole.number)
        .map(s => ({
          player_id: round.player[0]._key,
          hole: hole.number,
          gross: parseInt(s.gross),
        }))
    );
    scoresPerHole.set(hole.number, holeScores);
  }
  
  return {
    ...ctx,
    scoresPerHole,
  };
}

// Stage 2: Calculate pops (strokes received)
function calculatePops(ctx: ScoringContext): ScoringContext {
  const scoresWithPops = new Map();
  
  for (const [holeNum, scores] of ctx.scoresPerHole) {
    const hole = ctx.holes.find(h => h.number === holeNum);
    const scoresWithPops = scores.map(score => {
      const round = getRoundForPlayer(ctx.rounds, score.player_id);
      const courseHandicap = parseInt(round.course_handicap || '0');
      const allocation = hole.allocation || 18;
      const pops = courseHandicap >= allocation ? 1 : 0;
      
      return {
        ...score,
        pops,
      };
    });
    scoresPerHole.set(holeNum, scoresWithPops);
  }
  
  return {
    ...ctx,
    scoresPerHole,
  };
}

// Stage 3: Award junk
function awardJunk(ctx: ScoringContext): ScoringContext {
  const scoreboard = {...ctx.scoreboard};
  
  for (const junk of ctx.junk) {
    const awardFn = getJunkAwardFunction(junk);
    
    for (const hole of ctx.holes) {
      const holeData = scoreboard.holes[hole.number];
      awardFn(holeData, junk, ctx);
    }
  }
  
  return {
    ...ctx,
    scoreboard,
  };
}
```

### 2. Extract Calculation Engines

Pull out specific calculation logic into **composable engines**:

```typescript
// Ranking Engine
class RankingEngine {
  static rankWithTies<T>(
    items: T[],
    scoreGetter: (item: T) => number,
    better: 'lower' | 'higher'
  ): Array<{item: T; rank: number; tieCount: number}> {
    const sorted = [...items].sort((a, b) => {
      const diff = scoreGetter(a) - scoreGetter(b);
      return better === 'lower' ? diff : -diff;
    });
    
    const ranked = [];
    let currentRank = 1;
    let currentScore = scoreGetter(sorted[0]);
    let tieCount = 1;
    
    for (let i = 0; i < sorted.length; i++) {
      const score = scoreGetter(sorted[i]);
      
      if (score !== currentScore) {
        currentRank += tieCount;
        tieCount = 1;
        currentScore = score;
      } else {
        tieCount++;
      }
      
      ranked.push({
        item: sorted[i],
        rank: currentRank,
        tieCount,
      });
    }
    
    return ranked;
  }
}

// JSON Logic Engine (with caching)
class LogicEngine {
  private cache = new Map<string, any>();
  
  evaluate(
    expression: JsonLogicExpression,
    data: Record<string, any>
  ): boolean {
    const cacheKey = `${JSON.stringify(expression)}-${JSON.stringify(data)}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const result = jsonLogic.apply(expression, data);
    this.cache.set(cacheKey, result);
    return result;
  }
  
  clearCache() {
    this.cache.clear();
  }
}

// Points Engine
class PointsEngine {
  static calculate(
    basePoints: number,
    junk: Array<{value: number}>,
    multipliers: Array<{value: number}>
  ): number {
    const junkPoints = junk.reduce((sum, j) => sum + j.value, 0);
    const multiplier = multipliers.reduce((prod, m) => prod * m.value, 1);
    return (basePoints + junkPoints) * multiplier;
  }
  
  static forStableford(
    rank: number,
    tieCount: number,
    pointsTable: Array<{ranks: [number, number]; points: number}>
  ): number {
    const match = pointsTable.find(
      entry => entry.ranks[0] === rank && entry.ranks[1] === tieCount
    );
    return match?.points || 0;
  }
}
```

### 3. Dependency Graph for Calculations

Some calculations depend on previous holes. Model this explicitly:

```typescript
type HoleCalculation = {
  hole: string;
  dependencies: string[]; // Hole IDs this depends on
  calculate: (ctx: ScoringContext, prevResults: Map<string, HoleResult>) => HoleResult;
};

// Example: Multiplier based on previous hole
const preDoubleCalc: HoleCalculation = {
  hole: "5",
  dependencies: ["4"], // Depends on hole 4
  calculate: (ctx, prevResults) => {
    const prevHole = prevResults.get("4");
    const losingTeam = getTeamDownTheMost(prevHole);
    // Award pre-double to losing team
    return calculateWithMultiplier(ctx, "pre_double", losingTeam);
  }
};

// Execution: Topological sort + parallel where possible
class CalculationScheduler {
  static schedule(calculations: HoleCalculation[]): HoleCalculation[][] {
    // Returns array of batches that can run in parallel
    // Batch 0: Holes with no dependencies
    // Batch 1: Holes depending only on Batch 0
    // etc.
  }
}
```

---

## Performance Patterns

### 1. Memoization for Expensive Lookups

```typescript
class ScoringContext {
  private memoCache = new Map<string, any>();
  
  memoize<T>(key: string, fn: () => T): T {
    if (this.memoCache.has(key)) {
      return this.memoCache.get(key);
    }
    const result = fn();
    this.memoCache.set(key, result);
    return result;
  }
  
  // Example usage
  getOptionsForHole(hole: string): Option[] {
    return this.memoize(`options-${hole}`, () => {
      return this.options.filter(opt => 
        opt.values.some(v => v.holes.includes(hole))
      );
    });
  }
}
```

### 2. Incremental Calculation (for Live Scoring)

Instead of recalculating everything when one score changes:

```typescript
class IncrementalScorer {
  private scoreCache: Scoreboard;
  
  updateScore(
    player_id: string,
    hole: string,
    newGross: number
  ): Scoreboard {
    // 1. Identify affected holes (current + dependent holes)
    const affectedHoles = this.findAffectedHoles(hole);
    
    // 2. Recalculate only affected holes
    for (const h of affectedHoles) {
      this.recalculateHole(h);
    }
    
    // 3. Update cumulatives
    this.updateCumulatives(affectedHoles);
    
    return this.scoreCache;
  }
  
  private findAffectedHoles(changedHole: string): string[] {
    // Use dependency graph to find what needs recalc
    // Example: If hole 5 changed and hole 6 has "previous hole" logic,
    // both 5 and 6 need recalc
  }
}
```

### 3. Parallel Calculation (for Historical Games)

For calculating many games at once (e.g., leaderboards):

```typescript
// Web Workers for parallel scoring
class ParallelScorer {
  private workers: Worker[];
  
  async scoreGames(games: Game[]): Promise<Map<string, Scoreboard>> {
    const chunkSize = Math.ceil(games.length / this.workers.length);
    const chunks = chunk(games, chunkSize);
    
    const promises = chunks.map((chunk, i) => 
      this.workers[i].postMessage({type: 'score', games: chunk})
    );
    
    const results = await Promise.all(promises);
    return new Map(results.flatMap(r => r.entries));
  }
}
```

### 4. Smart Caching Strategy

```typescript
// Cache key based on game state
function getCacheKey(game: Game): string {
  // Include only data that affects scoring
  const relevantData = {
    gamespec_key: game.gamespecs[0]._key,
    options: game.options.map(o => `${o.name}:${o.values}`).join(','),
    scores: game.rounds.flatMap(r => 
      r.scores.map(s => `${s.hole}:${s.gross}`)
    ).join(','),
  };
  return hash(relevantData);
}

const scoreCache = new LRU<string, Scoreboard>({max: 100});

function scoreWithCache(game: Game): Scoreboard {
  const key = getCacheKey(game);
  if (scoreCache.has(key)) {
    return scoreCache.get(key);
  }
  
  const scoreboard = score(game);
  scoreCache.set(key, scoreboard);
  return scoreboard;
}
```

### 5. Lazy Evaluation for UI

Don't calculate what you don't show:

```typescript
class LazyScoreboard {
  constructor(private ctx: ScoringContext) {}
  
  // Calculate only when accessed
  get holes(): Map<string, HoleResult> {
    if (!this._holes) {
      this._holes = calculateAllHoles(this.ctx);
    }
    return this._holes;
  }
  
  // Calculate specific hole on demand
  getHole(hole: string): HoleResult {
    return this.holes.get(hole);
  }
  
  // Front 9 summary (calculate only front 9)
  getFront9Total(player_id: string): number {
    const front9 = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    return front9.reduce((sum, hole) => 
      sum + this.getHole(hole).players[player_id].points,
      0
    );
  }
}
```

---

## Testing Strategy

### 1. Unit Tests for Pure Functions

Since we broke up the monolith into pure functions, testing is straightforward:

```typescript
describe('calculatePops', () => {
  it('awards 1 pop when course handicap >= hole allocation', () => {
    const ctx: ScoringContext = {
      scoresPerHole: new Map([
        ['1', [{player_id: 'p1', hole: '1', gross: 5}]]
      ]),
      rounds: [{
        player: [{_key: 'p1'}],
        course_handicap: '10',
      }],
      holes: [{number: '1', allocation: 8}], // 10 >= 8 → 1 pop
    };
    
    const result = calculatePops(ctx);
    
    expect(result.scoresPerHole.get('1')[0].pops).toBe(1);
  });
  
  it('awards 0 pops when course handicap < hole allocation', () => {
    // ... similar test
  });
});
```

### 2. Integration Tests for Pipelines

Test combinations of stages:

```typescript
describe('Scoring Pipeline', () => {
  it('correctly scores a birdie with no multipliers', () => {
    const game = createTestGame({
      players: ['Alice', 'Bob'],
      scores: {
        '1': {Alice: 3, Bob: 4}, // Alice gets birdie (par 4)
      },
      junk: [BIRDIE_JUNK], // +1 point for birdie
      multipliers: [],
    });
    
    const scoreboard = score(game);
    
    expect(scoreboard.holes['1'].players.Alice.junk).toContainEqual({
      name: 'birdie',
      value: 1,
    });
  });
  
  it('applies multipliers to junk correctly', () => {
    const game = createTestGame({
      players: ['Alice', 'Bob'],
      scores: {
        '1': {Alice: 3, Bob: 4},
      },
      junk: [BIRDIE_JUNK],
      multipliers: [DOUBLE_MULTIPLIER], // 2x
    });
    
    const scoreboard = score(game);
    
    // Base points: 5 (outright win)
    // Junk: +1 (birdie)
    // Multiplier: 2x
    // Total: (5 + 1) * 2 = 12
    expect(scoreboard.holes['1'].players.Alice.points).toBe(12);
  });
});
```

### 3. Property-Based Tests

Use property-based testing for invariants:

```typescript
import fc from 'fast-check';

describe('Ranking properties', () => {
  it('always assigns rank 1 to best score', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({min: 1, max: 10}), {minLength: 2}),
        (scores) => {
          const ranked = RankingEngine.rankWithTies(
            scores.map((s, i) => ({id: i, score: s})),
            item => item.score,
            'lower'
          );
          
          const bestScore = Math.min(...scores);
          const rank1Items = ranked.filter(r => r.rank === 1);
          
          // All rank 1 items have the best score
          return rank1Items.every(r => r.item.score === bestScore);
        }
      )
    );
  });
});
```

### 4. Snapshot Tests for Complex Scenarios

```typescript
describe('Ten Points scoring', () => {
  it('matches expected scoreboard for full 18 holes', () => {
    const game = loadTestGame('ten-points-full-game.json');
    const scoreboard = score(game);
    
    // Snapshot entire scoreboard
    expect(scoreboard).toMatchSnapshot();
  });
});
```

### 5. Benchmark Tests

```typescript
import Benchmark from 'benchmark';

const suite = new Benchmark.Suite();

suite
  .add('Score 18 holes, 4 players', () => {
    const game = createTestGame({players: 4, holes: 18});
    score(game);
  })
  .add('Score with 10 junk options', () => {
    const game = createTestGame({
      players: 4,
      holes: 18,
      junk: Array(10).fill(BIRDIE_JUNK),
    });
    score(game);
  })
  .on('cycle', (event) => {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run();
```

**Target benchmarks for v0.5**:
- Score 18 holes, 4 players: < 10ms
- Score with 10 junk options: < 20ms
- Update single score (incremental): < 5ms

---

## Winning Patterns Summary

### 🏆 Top Recommendations

1. **Functional Pipeline Architecture**
   - Pure functions for each calculation stage
   - Immutable context passed through
   - Easy to test, reason about, and optimize

2. **Unified Option Model**
   - Single `Option` type with `type` and `sub_type`
   - Graph edges for relationships
   - Discriminated unions for type safety

3. **Composable Engines**
   - `RankingEngine`, `LogicEngine`, `PointsEngine`
   - Reusable across different game types
   - Testable in isolation

4. **Incremental Calculation**
   - Dependency graph for hole relationships
   - Only recalculate affected holes
   - Huge performance win for live scoring

5. **Aggressive Caching**
   - Memoize expensive lookups
   - Cache entire scoreboards with smart keys
   - LRU cache for memory management

6. **Lazy Evaluation**
   - Don't calculate what you don't show
   - Calculate on-demand for UI
   - Massive speedup for leaderboards (only show totals)

### 📊 Comparison: v0.3 vs v0.5 (Proposed)

| Aspect | v0.3 | v0.5 (Proposed) |
|--------|------|-----------------|
| **Architecture** | Monolith function | Functional pipeline |
| **Testability** | Hard (1 giant function) | Easy (pure functions) |
| **Performance** | O(holes × players) | Same, but cacheable |
| **Incremental Updates** | Recalc everything | Recalc only affected |
| **Data Model** | Mixed (embedded + graph) | Unified graph |
| **Type Safety** | Weak (any everywhere) | Strong (discriminated unions) |
| **Extensibility** | Hard (modify monolith) | Easy (add stages) |
| **Debugging** | Console logs | Pure functions + snapshots |

---

## Example: Refactored Ten Points Scoring

Here's what a refactored Ten Points scorer might look like:

```typescript
// Ten Points specific configuration
const TEN_POINTS_CONFIG = {
  pointsTable: [
    {ranks: [1, 1], points: 5}, // Outright winner
    {ranks: [1, 2], points: 4}, // 2-way tie for 1st
    {ranks: [1, 3], points: 3}, // 3-way tie
    {ranks: [2, 1], points: 3}, // Alone in 2nd
    {ranks: [2, 2], points: 2}, // 2-way tie for 2nd
    {ranks: [3, 1], points: 1}, // DFL
  ],
  junk: [
    {name: 'birdie', value: 1, logic: {scoreToPar: -1}},
    {name: 'eagle', value: 2, logic: {scoreToPar: -2}},
    {name: 'prox', value: 1, logic: {type: 'user'}},
  ],
  multipliers: [
    {name: 'double', value: 2},
    {name: 'birdie_bbq', value: 2, basedOn: 'birdie'},
    {name: 'eagle_bbq', value: 4, basedOn: 'eagle'},
  ],
};

// Scorer instance
const tenPointsScorer = new Scorer({
  name: 'Ten Points',
  config: TEN_POINTS_CONFIG,
  pipeline: [
    initializeScoreboard,
    calculateGrossScores,
    calculatePops,
    calculateNetScores,
    assignTeamsIndividual, // Each player is own team
    rankTeams,
    awardJunkByLogic,
    applyMultipliersByAvailability,
    calculatePointsByTable,
    calculateCumulatives,
  ],
});

// Usage
const scoreboard = tenPointsScorer.score(game);
```

**Key improvements**:
- Configuration separate from logic
- Reusable pipeline stages
- Easy to create new game variants (just change config)
- Testable at every level

---

## Next Steps for v0.5 Implementation

1. **Phase 1: Data Model** (Week 1-2)
   - Design `Option` schema with discriminated unions
   - Migrate gamespecs to use unified option model
   - Set up graph edges: `gamespec2option`, `game2option`

2. **Phase 2: Core Engines** (Week 2-3)
   - Implement `RankingEngine` with comprehensive tests
   - Implement `LogicEngine` with caching
   - Implement `PointsEngine` for various point systems

3. **Phase 3: Pipeline Architecture** (Week 3-4)
   - Build `ScoringContext` type
   - Implement base stages (gross, net, pops, teams)
   - Build pipeline executor with memoization

4. **Phase 4: Junk & Multipliers** (Week 4-5)
   - Port junk award logic to new engine
   - Port multiplier logic to new engine
   - Test extensively with Ten Points game

5. **Phase 5: Optimization** (Week 5-6)
   - Implement incremental calculation
   - Add caching layer
   - Benchmark and optimize hot paths

6. **Phase 6: Migration** (Week 6+)
   - Parallel run: v0.3 and v0.5 side-by-side
   - Verify identical results
   - Gradual cutover

---

## Questions to Consider

1. **Game Variants**: How different are game types (Ten Points, Nassau, Skins, etc.)? Can we share 80%+ of the pipeline?

2. **Real-time Updates**: Do you need live scoring (scores update as players enter them)? Or batch calculation?

3. **Historical Data**: Do you need to recalculate old games? Or only new ones?

4. **Mobile Performance**: What's the target device? (iPhone 12+ can handle more computation)

5. **Offline Support**: Does scoring need to work offline? (Affects caching strategy)

---

## Resources

- **JSON Logic**: https://jsonlogic.com/ (already using this)
- **Perspective** - replacement for JSON Logic?  research this, maybe use Nitro Modules if it's C++
- **Immer**: https://immerjs.github.io/ (for immutable updates if needed)
- **fp-ts**: https://gcanti.github.io/fp-ts/ (functional programming utilities)
- **fast-check**: https://fast-check.dev/ (property-based testing)
- **ts-pattern**: pattern-matching in Typescript, not sure about speed impact of this lib

---

**End of Analysis**

Let me know if you want me to dive deeper into any section or if you have questions about the recommendations!
