# Game Import Plan: ArangoDB v0.3 → Jazz

## Prerequisites
- Players already imported to `catalog.players` (keyed by `ghinId` or `manual_{legacyId}`)
- Game specs/options already imported to `catalog.specs` and `catalog.options`

## Key Decisions

### Storage
- Games: `catalog.games` (MapOfGames, keyed by ArangoDB `_key`)
- Courses: `catalog.courses` (MapOfCourses, keyed by GHIN course ID)
- Rounds: Reference courses via `courseId`/`teeId` strings + optional `TeeOverrides`

### Permissions
- Game groups are PUBLIC for now (deferred account claiming)
- When users sign up with ghinId, they'll "claim" their player and get added to game groups
- Player schema may need `claimedBy: z.string().optional()` later

### Options Storage (Per-Hole Granularity)
- **Game-level options** (stakes, use_handicaps): Store on `GameHole.options`
- **Junk/multipliers** (birdie, prox, press): Store on `Team.options` with player attribution

v0.3 junk structure (from ArangoDB query):
```javascript
{ name: "prox", player: "65888039", value: "true" }
```
Junk is on Team but attributed to specific player.

### New Schema: TeamOption
```typescript
export const TeamOption = co.map({
  optionName: z.string(),           // "prox", "birdie", etc.
  value: z.string(),                // "true", "2", etc.
  playerId: z.string().optional(),  // Which player earned it
});
export const ListOfTeamOptions = co.list(TeamOption);
```

Add to Team:
```typescript
export const Team = co.map({
  team: z.string(),
  rounds: ListOfRoundToTeams,
  options: co.optional(ListOfTeamOptions),  // NEW
});
```

### Legacy IDs
- `Game.legacyId` - ArangoDB `_key`
- `Round.legacyId` - ArangoDB `_key`

---

## Schema Changes

### 1. catalog.ts
```typescript
export const MapOfCourses = co.record(z.string(), Course);
export const MapOfGames = co.record(z.string(), Game);

export const GameCatalog = co.map({
  specs: MapOfGameSpecs,
  options: co.optional(MapOfOptions),
  players: co.optional(MapOfPlayers),
  courses: co.optional(MapOfCourses),  // NEW
  games: co.optional(MapOfGames),      // NEW
});
```

### 2. games.ts
Add `legacyId: z.string().optional()` to Game

### 3. rounds.ts
Add to Round:
- `legacyId: z.string().optional()`
- `courseId: z.string().optional()`
- `teeId: z.string().optional()`
- `teeOverrides: co.optional(TeeOverrides)`

New TeeOverrides schema:
```typescript
export const TeeHoleOverride = co.map({
  hole: z.number(),
  par: z.number().optional(),
  yards: z.number().optional(),
  meters: z.number().optional(),
  handicap: z.number().optional(),
});
export const ListOfTeeHoleOverrides = co.list(TeeHoleOverride);

export const TeeOverrides = co.map({
  name: z.string().optional(),
  totalYardage: z.number().optional(),
  totalMeters: z.number().optional(),
  holes: co.optional(ListOfTeeHoleOverrides),
});
```

### 4. teams.ts
Add TeamOption schema (see above) and add `options: co.optional(ListOfTeamOptions)` to Team

### 5. gameholes.ts
Add `options: co.optional(MapOfOptions)` to GameHole for game-level per-hole options

### 6. Update schema/index.ts exports

---

## ArangoDB Types (arango.ts)

```typescript
export interface RoundV03 {
  _key: string;
  date: string;
  seq: number;
  scores: Array<{ hole: string; values: Array<{ k: string; v: string; ts?: string }> }>;
  tees: Array<{
    tee_id: string;
    course_id: string;
    name: string;
    TotalYardage: number;
    holes: Array<{ hole: string; par: number; length: number; handicap: number }>;
    Ratings: { total?: TeeRating; front?: TeeRating; back?: TeeRating };
    course: { course_id: string; course_name: string; course_city?: string; course_state?: string };
  }>;
}

export interface GameV03 {
  _key: string;
  name: string;
  start: string;
  scope: { holes: string; teams_rotate?: string; wolf_order?: string[] };
  holes: Array<{
    hole: string;
    teams: Array<{
      team: string;
      players: string[];
      junk?: Array<{ name: string; player: string; value: string }>;
    }>;
    multipliers?: Array<{ name: string; team: string; first_hole: string; value: number }>;
  }>;
  options?: Array<{ name: string; values: Array<{ value: string; holes: string[] }> }>;
}

export interface RoundToGameEdgeV03 {
  handicap_index: string;
  course_handicap?: number;
  game_handicap?: number;
}

export interface GameWithRoundsV03 {
  game: GameV03;
  rounds: Array<{ round: RoundV03; edge: RoundToGameEdgeV03; playerId: string }>;
  gamespecKey: string;
}
```

---

## ArangoDB Queries (arango.ts)

### fetchGameWithRounds(db, gameKey)
```aql
LET game = DOCUMENT("games", @gameKey)
LET gamespec = FIRST(
  FOR v, e IN 1..1 OUTBOUND game._id GRAPH 'games'
    FILTER e.type == 'game2gamespec'
    RETURN v._key
)
LET rounds = (
  FOR v, e IN 1..1 INBOUND game._id GRAPH 'games'
    FILTER e.type == 'round2game'
    LET player = FIRST(
      FOR p, pe IN 1..1 OUTBOUND v._id GRAPH 'games'
        FILTER pe.type == 'round2player'
        RETURN p._key
    )
    RETURN { round: v, edge: e, playerId: player }
)
RETURN { game, rounds, gamespecKey: gamespec }
```

### fetchAllGames(db, offset, limit)
Returns `{ games: GameListV03[], total: number }` for pagination.

---

## Import Logic (catalog.ts)

### upsertCourse(catalog, courseData, teeData, workerAccount)
1. Initialize `catalog.courses` if needed (public group)
2. Check if course exists by GHIN ID
3. If not, create Course with basic fields
4. Check if tee exists on course by tee ID
5. If not, create Tee with holes and push to course.tees
6. Return `{ courseId, teeId }`

### createRound(roundData, edgeData, playerId, courseId, teeId, group)
1. Create RoundScores from roundData.scores (keys are "1"-"18", golfer-friendly)
2. Create Round with legacyId, courseId, teeId, scores
3. Return round

### importGame(workerAccount, catalog, gameData)
1. Skip if `catalog.games[game._key]` exists (idempotent)
2. Look up players in catalog.players (by ghinId or manual_{_key})
3. Create public group
4. For each round: upsertCourse, createRound, create RoundToGame
5. Create GameHoles with Teams, including:
   - Team.options for junk (with player attribution)
   - GameHole.options for game-level options
6. Create Game with legacyId, scope, holes, rounds, players
7. Add to catalog.games[game._key]

### importGamesFromArango(workerAccount, arangoConfig, batchSize)
1. Fetch games in batches via fetchAllGames
2. For each game: fetchGameWithRounds, importGame
3. Track created/skipped/failed counts
4. Return GameImportResult

---

## API Endpoint

POST `/v4/catalog/import/games` - calls importGamesFromArango, returns results

Update existing import UI to show games section.

---

## Error Handling
- Missing player: skip round, log warning
- Missing gamespec: create game without spec reference
- Missing tee data: skip round, log warning
- Already imported: skip (idempotent)

---

## Implementation Order
1. Schema changes (lib)
2. ArangoDB types and queries (api)
3. Import functions (api)
4. API endpoint (api)
5. Web UI update (web)
6. Quality checks: `bun format && bun lint && bun tsc`
