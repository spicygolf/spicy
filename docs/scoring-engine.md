# Spicy Golf Scoring Engine

**Purpose**: Document the scoring engine architecture and implementation plan for v0.5

---

## Table of Contents
1. [Implementation Status](#implementation-status)
2. [Schema Overview](#schema-overview)
3. [Scoring Pipeline Architecture](#scoring-pipeline-architecture)
4. [Core Engines](#core-engines)
5. [Options: Junk & Multipliers](#options-junk--multipliers)
6. [Game-Specific Scoring](#game-specific-scoring)
7. [Performance Patterns](#performance-patterns)
8. [Testing Strategy](#testing-strategy)

---

## Implementation Status

### Schema Layer (Complete)

| Component | Status | Location |
|-----------|--------|----------|
| Score Schema (flat) | ✅ Done | `packages/lib/schema/scores.ts` |
| Unified Options Schema | ✅ Done | `packages/lib/schema/options.ts` |
| GameSpec with MapOfOptions | ✅ Done | `packages/lib/schema/gamespecs.ts` |
| Game with options copy | ✅ Done | `packages/lib/schema/games.ts` |
| GameHole with teams + options | ✅ Done | `packages/lib/schema/gameholes.ts` |
| Teams schema (Team, RoundToTeam) | ✅ Done | `packages/lib/schema/teams.ts` |
| TeamsConfig with active flag | ✅ Done | `packages/lib/schema/teamsconfig.ts` |
| Basic score utilities | ✅ Done | `packages/lib/utils/scores.ts` |
| Handicap utilities | ✅ Done | `packages/lib/utils/handicap.ts` |

### Scoring Engine (Not Started)

| Component | Status | Notes |
|-----------|--------|-------|
| ScoringContext type | ❌ | Immutable context for pipeline |
| Pipeline stages | ❌ | Pure functions for each calculation |
| RankingEngine | ❌ | Rank with ties algorithm |
| PointsEngine | ❌ | Points calculation by rank |
| Junk award logic | ❌ | Award dots based on logic expressions |
| Multiplier logic | ❌ | Apply multipliers based on availability |
| Scoreboard caching | ❌ | TBD: CoMap on Game or pure computation |

---

## Schema Overview

### Score Storage (Flat Structure)

```typescript
// packages/lib/schema/scores.ts

// Per-hole scores: keys are "gross", "pops", or junk names
const HoleScores = co.record(z.string(), z.string());

// Round scores: keys are hole numbers "1"-"18"
const RoundScores = co.record(z.string(), HoleScores);

// Access pattern: round.scores["5"].gross
```

**Design Decisions**:
- 1-indexed hole numbers (golfer-friendly: "1"-"18")
- String values for consistency with legacy data
- Supports extra holes: "19", "20" for tiebreakers

### Unified Options (Discriminated Union)

```typescript
// packages/lib/schema/options.ts

const Option = co.discriminatedUnion("type", [
  GameOption,      // type: "game" - settings like stakes, handicap mode
  JunkOption,      // type: "junk" - birdies, sandies, greenies
  MultiplierOption // type: "multiplier" - doubles, presses
]);

// Map for O(1) lookups: gameSpec.options["birdie"]
const MapOfOptions = co.record(z.string(), Option);
```

**Key Benefits**:
- Single source for all options (no separate collections)
- O(1) lookup by name: `options["birdie"]`
- Type-safe via discriminated union
- Filter by type: `Object.values(options).filter(o => o.type === "junk")`

### Teams Structure

```typescript
// packages/lib/schema/teams.ts

const Team = co.map({
  team: z.string(),              // "1", "2", "Team A"
  rounds: ListOfRoundToTeams,    // Players on this team (via RoundToGame edges)
  options: ListOfTeamOptions,    // Junk/multipliers for this team
});

const TeamOption = co.map({
  optionName: z.string(),        // "birdie", "double"
  value: z.string(),             // "true", "2"
  playerId: z.string().optional() // Who earned it (for attribution)
});
```

### Game Hierarchy

```
Game
├── scope: GameScope (holes: "all18"|"front9"|"back9", teamsConfig)
├── specs: ListOfGameSpecs (game rules)
├── options: MapOfOptions (copied from spec, customized for this game)
├── holes: ListOfGameHoles
│   └── GameHole
│       ├── hole: string ("1"-"18")
│       ├── seq: number (play order)
│       ├── teams: ListOfTeams
│       └── options: MapOfOptions (per-hole overrides)
├── players: ListOfPlayers
└── rounds: ListOfRoundToGames
    └── RoundToGame
        ├── round: Round (scores, course, tee)
        ├── handicapIndex: string
        ├── courseHandicap: number
        └── gameHandicap: number (optional override)
```

---

## Scoring Pipeline Architecture

### Functional Pipeline Design

The scoring engine uses a **functional pipeline** of pure functions, making it testable, cacheable, and easy to extend.

```typescript
// Context: Immutable data passed through pipeline
type ScoringContext = {
  // Input data
  game: Game;
  gameSpec: GameSpec;
  options: MapOfOptions;
  holes: GameHole[];
  rounds: RoundToGame[];
  
  // Computed lookups (built once, reused)
  playerHandicaps: Map<string, number>;  // playerId → effective handicap
  teamsPerHole: Map<string, Team[]>;     // holeNum → teams
  
  // Results (built up through pipeline)
  scoreboard: Scoreboard;
};

// Pipeline stage: pure function
type Stage = (ctx: ScoringContext) => ScoringContext;

// Main pipeline
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
  const ctx = buildContext(game);
  const final = scoringPipeline.reduce((c, stage) => stage(c), ctx);
  return final.scoreboard;
}
```

### Scoreboard Output Structure

```typescript
type Scoreboard = {
  holes: Record<string, HoleResult>;  // "1"-"18"
  cumulative: {
    players: Record<string, PlayerCumulative>;
    teams: Record<string, TeamCumulative>;
  };
};

type HoleResult = {
  players: Record<string, PlayerHoleResult>;
  teams: Record<string, TeamHoleResult>;
};

type PlayerHoleResult = {
  gross: number;
  pops: number;
  net: number;
  rank: number;
  tieCount: number;
  junk: Array<{ name: string; value: number }>;
  multipliers: Array<{ name: string; value: number }>;
  points: number;
};

type TeamHoleResult = {
  score: number;           // Team score (best ball, aggregate, etc.)
  rank: number;
  tieCount: number;
  junk: Array<{ name: string; value: number; playerId?: string }>;
  multipliers: Array<{ name: string; value: number }>;
  points: number;
};
```

### Scoreboard Storage Decision

**Option A: Pure Computation** (v0.3 approach)
- Recalculate on every render
- Simple, no sync issues
- May be slow for complex games

**Option B: Cached CoMap on Game**
- Store computed scoreboard on Game
- Update when scores change
- Enables access outside game context (leaderboards, history)

**Recommendation**: Start with pure computation, measure performance, add CoMap caching if needed. The schema supports both approaches.

---

## Core Engines

### RankingEngine

Handles ranking with ties (critical for golf scoring).

```typescript
class RankingEngine {
  /**
   * Rank items with tie handling
   * @param items - Items to rank
   * @param scoreGetter - Function to get score from item
   * @param better - "lower" for golf (lower is better), "higher" for points
   * @returns Items with rank and tieCount
   */
  static rankWithTies<T>(
    items: T[],
    scoreGetter: (item: T) => number,
    better: 'lower' | 'higher' = 'lower'
  ): Array<{ item: T; rank: number; tieCount: number }> {
    // Sort by score
    const sorted = [...items].sort((a, b) => {
      const diff = scoreGetter(a) - scoreGetter(b);
      return better === 'lower' ? diff : -diff;
    });
    
    const results: Array<{ item: T; rank: number; tieCount: number }> = [];
    let currentRank = 1;
    let i = 0;
    
    while (i < sorted.length) {
      const currentScore = scoreGetter(sorted[i]);
      
      // Count ties at this score
      let tieCount = 1;
      while (i + tieCount < sorted.length && 
             scoreGetter(sorted[i + tieCount]) === currentScore) {
        tieCount++;
      }
      
      // Assign same rank to all tied items
      for (let j = 0; j < tieCount; j++) {
        results.push({
          item: sorted[i + j],
          rank: currentRank,
          tieCount,
        });
      }
      
      // Skip ranks for ties (1st, 1st → next is 3rd)
      currentRank += tieCount;
      i += tieCount;
    }
    
    return results;
  }
}
```

**Examples**:
- Input scores: `[4, 3, 3, 5]` → Ranks: `[2, 1, 1, 4]`
- Two-way tie for 1st: rank=1, tieCount=2
- Next player gets rank=3 (not 2)

### PointsEngine

Calculates points based on rank and game rules.

```typescript
type PointsTableEntry = {
  rank: number;
  tieCount: number;
  points: number;
};

class PointsEngine {
  /**
   * Look up points from a points table
   */
  static fromTable(
    rank: number,
    tieCount: number,
    table: PointsTableEntry[]
  ): number {
    const entry = table.find(e => e.rank === rank && e.tieCount === tieCount);
    return entry?.points ?? 0;
  }
  
  /**
   * Calculate total points with junk and multipliers
   */
  static calculate(
    basePoints: number,
    junk: Array<{ value: number }>,
    multipliers: Array<{ value: number }>
  ): number {
    const junkPoints = junk.reduce((sum, j) => sum + j.value, 0);
    const multiplier = multipliers.reduce((prod, m) => prod * m.value, 1);
    return (basePoints + junkPoints) * multiplier;
  }
}
```

---

## Options: Junk & Multipliers

### JunkOption Schema

```typescript
const JunkOption = co.map({
  name: z.string(),           // "birdie"
  disp: z.string(),           // "Birdie"
  type: z.literal(["junk"]),
  version: z.string(),
  sub_type: z.literal(["dot", "skin", "carryover"]),
  value: z.number(),          // Points value (e.g., 1 for birdie)
  
  // Evaluation criteria
  scope: z.literal(["player", "team", "hole"]),
  based_on: z.literal(["gross", "net", "user"]),
  score_to_par: z.string(),   // "exactly -1" for birdie
  logic: z.string(),          // JSON Logic expression (optional)
  
  // Display
  icon: z.string(),
  show_in: z.literal(["score", "faves", "none"]),
});
```

### Junk Evaluation

```typescript
function evaluateJunk(
  junk: JunkOption,
  player: PlayerHoleResult,
  hole: { par: number },
  ctx: ScoringContext
): boolean {
  // Simple score-to-par check
  if (junk.score_to_par) {
    const scoreToPar = player.gross - hole.par;
    return matchesScoreToPar(scoreToPar, junk.score_to_par);
  }
  
  // Complex JSON Logic
  if (junk.logic) {
    const expression = JSON.parse(junk.logic);
    return evaluateJsonLogic(expression, { player, hole, ctx });
  }
  
  // User-entered (prox, etc.)
  if (junk.based_on === "user") {
    // Check if user marked this junk for this player/hole
    return checkUserJunk(player.playerId, hole.number, junk.name, ctx);
  }
  
  return false;
}

function matchesScoreToPar(actual: number, condition: string): boolean {
  // Parse conditions like "exactly -1", "at_most -2", "at_least 1"
  const [operator, valueStr] = condition.split(" ");
  const value = parseInt(valueStr, 10);
  
  switch (operator) {
    case "exactly": return actual === value;
    case "at_most": return actual <= value;
    case "at_least": return actual >= value;
    default: return false;
  }
}
```

### MultiplierOption Schema

```typescript
const MultiplierOption = co.map({
  name: z.string(),           // "double", "birdie_bbq"
  disp: z.string(),           // "Double"
  type: z.literal(["multiplier"]),
  version: z.string(),
  sub_type: z.literal(["bbq", "press", "automatic"]),
  value: z.number(),          // Multiplier value (e.g., 2 for double)
  
  // Trigger conditions
  based_on: z.string(),       // Junk name that triggers this (e.g., "birdie")
  availability: z.string(),   // JSON Logic for when available
  scope: z.literal(["player", "team", "hole", "rest_of_nine", "game"]),
  
  // UI
  icon: z.string(),
  override: z.boolean(),      // Can user override automatic trigger?
});
```

### Multiplier Types

| Type | Trigger | Example |
|------|---------|---------|
| `automatic` | Triggered by junk | Birdie BBQ (birdie doubles the bet) |
| `press` | User-activated during play | Press, press-back |
| `bbq` | Junk-triggered doubling | Eagle BBQ (4x) |

### Multiplier Evaluation

```typescript
function evaluateMultiplier(
  mult: MultiplierOption,
  player: PlayerHoleResult,
  team: TeamHoleResult,
  ctx: ScoringContext
): boolean {
  // Automatic: triggered by junk
  if (mult.sub_type === "automatic" || mult.sub_type === "bbq") {
    if (mult.based_on) {
      // Check if the triggering junk was awarded
      const hasJunk = player.junk.some(j => j.name === mult.based_on) ||
                      team.junk.some(j => j.name === mult.based_on);
      return hasJunk;
    }
  }
  
  // User-activated (press)
  if (mult.sub_type === "press") {
    return checkUserMultiplier(team.teamId, mult.name, ctx);
  }
  
  // Complex availability logic
  if (mult.availability) {
    const expression = JSON.parse(mult.availability);
    return evaluateJsonLogic(expression, { player, team, ctx });
  }
  
  return false;
}
```

---

## Game-Specific Scoring

### Five Points (Primary Test Game)

Most common game, good baseline for implementation.

**Config**:
- 4 players, 2 teams (2v2)
- Best ball scoring
- 5 points per hole: 3 for low ball, 2 for low total

**Points Table**:
| Scenario | Points |
|----------|--------|
| Win low ball outright | 3 |
| Tie low ball | 1.5 each |
| Win low total outright | 2 |
| Tie low total | 1 each |

**Team Score Calculation**:
```typescript
function fivePointsTeamScore(team: Team, hole: HoleResult): TeamScore {
  const playerScores = team.rounds.map(r => 
    hole.players[r.roundToGame.round.playerId]
  );
  
  return {
    lowBall: Math.min(...playerScores.map(p => p.net)),
    total: playerScores.reduce((sum, p) => sum + p.net, 0),
  };
}
```

### Ten Points

3-player individual game, no teams.

**Config**:
- 3 players, individual (each player is own "team")
- 10 points per hole distributed by rank

**Points Table**:
| Rank | Tie Count | Points |
|------|-----------|--------|
| 1 | 1 | 5 |
| 1 | 2 | 4 |
| 1 | 3 | 3.33 |
| 2 | 1 | 3 |
| 2 | 2 | 2 |
| 3 | 1 | 2 |

### Nassau

Side-bet structure on front 9, back 9, and overall.

**Config**:
- 2 or 4 players (individual or 2v2)
- Three separate bets: front, back, overall
- Match play scoring (holes won, not strokes)

### Wolf

Rotating team selection game.

**Config**:
- 4 players
- Teams rotate every hole (`teamsConfig.rotateEvery: 1`)
- Wolf (lead player) picks partner or goes alone
- Lone wolf vs. field scoring

---

## Performance Patterns

### Local-First Advantage

All data is local (Jazz), so reads are instant. Focus optimization on computation, not I/O.

```typescript
// Fast: all local reads
const game = await Game.load(gameId);
const scoreboard = score(game);  // Pure computation
```

### Lazy Loading Strategy

Ensure all data is loaded upfront to avoid waterfalls.

```typescript
// Load game with all nested data
const game = await Game.load(gameId, {
  resolve: {
    specs: { options: true },
    holes: { teams: { rounds: { roundToGame: { round: { scores: { $each: true } } } } } },
    rounds: { round: { scores: { $each: true }, tee: true } },
    options: true,
  }
});
```

### Memoization

Cache expensive lookups within a scoring run.

```typescript
class ScoringContext {
  private cache = new Map<string, unknown>();
  
  memoize<T>(key: string, fn: () => T): T {
    if (!this.cache.has(key)) {
      this.cache.set(key, fn());
    }
    return this.cache.get(key) as T;
  }
  
  getPlayerHandicap(playerId: string): number {
    return this.memoize(`handicap:${playerId}`, () => {
      const rtg = this.rounds.find(r => r.round.playerId === playerId);
      return rtg?.gameHandicap ?? rtg?.courseHandicap ?? 0;
    });
  }
}
```

### Target Performance

| Operation | Target | Notes |
|-----------|--------|-------|
| Full 18-hole scoring | < 10ms | 4 players, 10 junk options |
| Incremental update | < 5ms | Single score change |
| UI render | < 16ms | 60fps target |

---

## Testing Strategy

### Unit Tests (Pure Functions)

```typescript
describe('RankingEngine', () => {
  it('ranks with ties correctly', () => {
    const scores = [
      { id: 'a', score: 4 },
      { id: 'b', score: 3 },
      { id: 'c', score: 3 },
      { id: 'd', score: 5 },
    ];
    
    const ranked = RankingEngine.rankWithTies(scores, s => s.score, 'lower');
    
    expect(ranked).toEqual([
      { item: { id: 'b', score: 3 }, rank: 1, tieCount: 2 },
      { item: { id: 'c', score: 3 }, rank: 1, tieCount: 2 },
      { item: { id: 'a', score: 4 }, rank: 3, tieCount: 1 },
      { item: { id: 'd', score: 5 }, rank: 4, tieCount: 1 },
    ]);
  });
});
```

### Integration Tests (Pipeline)

```typescript
describe('Five Points Scoring', () => {
  it('awards 3 points for outright low ball win', () => {
    const game = createTestGame({
      spec: 'Five Points',
      players: ['Alice', 'Bob', 'Carol', 'Dave'],
      teams: [['Alice', 'Bob'], ['Carol', 'Dave']],
      scores: {
        '1': { Alice: 4, Bob: 5, Carol: 5, Dave: 6 },
      },
    });
    
    const scoreboard = score(game);
    
    // Team 1 has low ball (Alice: 4) and low total (9 vs 11)
    expect(scoreboard.holes['1'].teams['1'].points).toBe(5);
    expect(scoreboard.holes['1'].teams['2'].points).toBe(0);
  });
});
```

### Snapshot Tests

```typescript
describe('Full Game Scoring', () => {
  it('matches expected scoreboard for 18-hole game', () => {
    const game = loadTestGame('five-points-full.json');
    const scoreboard = score(game);
    expect(scoreboard).toMatchSnapshot();
  });
});
```

### Property-Based Tests

```typescript
import fc from 'fast-check';

describe('Ranking Properties', () => {
  it('total points always equals 10 for Ten Points', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 60, max: 120 }), { minLength: 3, maxLength: 3 }),
        (scores) => {
          const scoreboard = scoreTenPoints(scores);
          const totalPoints = Object.values(scoreboard.players)
            .reduce((sum, p) => sum + p.points, 0);
          return totalPoints === 10;
        }
      )
    );
  });
});
```

---

## Implementation Phases

### Phase 1: Core Engines
1. Create `packages/lib/scoring/` directory
2. Implement `RankingEngine`
3. Implement `PointsEngine`
4. Define `ScoringContext` and `Scoreboard` types
5. Unit tests for engines

### Phase 2: Pipeline Stages
1. `initializeScoreboard`
2. `calculateGrossScores` (extract from rounds)
3. `calculatePops` (use existing utility)
4. `calculateNetScores` (use existing utility)
5. `assignTeams` (read from GameHole.teams)
6. `rankPlayers` and `rankTeams`

### Phase 3: Five Points Implementation
1. `calculateTeamScores` (best ball + total)
2. `calculatePoints` (Five Points table)
3. `calculateCumulatives`
4. Integration tests

### Phase 4: Junk & Multipliers
1. Junk evaluation logic
2. Multiplier evaluation logic
3. Wire into pipeline
4. Test with birdie/eagle scenarios

### Phase 5: Additional Games
1. Ten Points
2. Nassau
3. Wolf
4. Skins

### Phase 6: App Integration
1. React hooks for scoring
2. Real-time score updates
3. Performance optimization
4. Caching (if needed)

---

## Appendix: v0.3 to v0.5 Migration

### What Changed

| v0.3 | v0.5 |
|------|------|
| Embedded arrays for options | Discriminated union + Map |
| Separate junk/multiplier lists | Unified `MapOfOptions` |
| Nested score values | Flat `HoleScores` record |
| Mixed ArangoDB graph | Pure Jazz CoMaps |
| Monolith `scoring()` function | Functional pipeline |

### Seed Data

Game specs and options are seeded from JSON files:
- `data/seed/specs/` - GameSpec definitions
- `data/seed/options/` - Option definitions

This allows:
- Easy editing and review of game rules
- Version control for spec changes
- Testing with known configurations
- Adding new games without code changes
