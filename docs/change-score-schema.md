# Score Schema Redesign

## Status: Approved

## Problem Statement

The current scoring schema is overly complex, modeled after the old ArangoDB structure with nested CoMaps and Lists. This creates:
- Unnecessary CoValue overhead
- Complex access patterns (`score.values.find(v => v.k === "gross")?.v`)
- History tracking that's tightly coupled to score values

## Goals

1. **Flat, intuitive access**: `round.scores["5"].gross` instead of nested lookups
2. **Separate history**: Append-only change log, lazy-loaded
3. **Reduced CoValue overhead**: Fewer nested CoMaps
4. **Simpler imports**: Easier to map from ArangoDB legacy data

## Current Schema

```typescript
// Per-score value object
const Value = co.map({
  k: z.string(),
  v: z.string(),
  byPlayerId: z.string(),
  at: z.date(),
});

const ListOfValues = co.list(Value);

// Per-hole score
const Score = co.map({
  seq: z.number(),
  values: ListOfValues,
  history: ListOfScoreUpdate,  // audit trail
});

// Map of hole index to Score
const MapOfScores = co.record(z.string(), Score);

// In Round:
scores: MapOfScores
```

**Access pattern**: `round.scores["5"].values.find(v => v.k === "gross")?.v`

## Proposed Schema

```typescript
/**
 * HoleScores - All score values for a single hole
 * Keys: "gross", "pops", "net", or junk names like "birdie", "sandy"
 * Values: string (numbers as strings for consistency)
 */
export const HoleScores = co.record(z.string(), z.string());
export type HoleScores = co.loaded<typeof HoleScores>;

/**
 * RoundScores - All scores for a round, keyed by hole number
 * Keys: "1", "2", ... "18" (golfer-friendly, 1-indexed)
 * Supports extra holes: "19", "20", etc.
 */
export const RoundScores = co.record(z.string(), HoleScores);
export type RoundScores = co.loaded<typeof RoundScores>;

/**
 * ScoreChange - A single score change event
 * Stored in a CoFeed for append-only history
 * 
 * Note: playerId is not needed here because history lives on the Round,
 * which already has playerId. Jazz provides createdAt and account attribution.
 */
export const ScoreChange = co.map({
  hole: z.string(),               // "5"
  key: z.string(),                // "gross"
  value: z.string(),              // "4"
  prev: z.optional(z.string()),   // previous value, if any
});
export type ScoreChange = co.loaded<typeof ScoreChange>;

/**
 * ScoreHistory - Append-only feed of score changes
 * Jazz CoFeed provides: createdAt, session/account attribution, ordering
 */
export const ScoreHistory = co.feed(ScoreChange);
export type ScoreHistory = co.loaded<typeof ScoreHistory>;
```

**Access pattern**: `round.scores["5"].gross`

### Round Schema Changes

```typescript
export const Round = co.map({
  createdAt: z.date(),
  playerId: z.string(),
  handicapIndex: z.string(),
  course: co.optional(Course),
  tee: co.optional(Tee),
  
  // NEW: Flat scores structure
  scores: RoundScores,
  
  // NEW: Optional history feed (lazy-loaded)
  history: co.optional(ScoreHistory),
  
  legacyId: z.string().optional(),
  teeOverrides: co.optional(TeeOverrides),
});
```

## Design Decisions

### Why CoFeed for History?

- **Append-only**: Score changes are immutable events
- **Per-session attribution**: Jazz tracks who wrote each entry automatically
- **Lazy-loading**: History only loads when explicitly requested
- **No ordering concerns**: Each user's changes are ordered within their session

### Why Strings for Values?

- Consistent with old ArangoDB format
- Avoids type coercion issues
- Junk values may be non-numeric in the future
- Parse to number when needed for calculations

### CoMap Overhead for ScoreChange

We considered using plain JSON strings in the feed, but:
- CoFeed requires CoValue types
- `co.feed(z.string())` would lose type safety
- ScoreChange entries are small (4 string fields)
- Write-once, immutable after creation
- Lazy-loaded, so no impact on scoring performance

## Migration Impact

### Files to Update

1. **`packages/lib/schema/scores.ts`** - New schema definitions
2. **`packages/lib/schema/rounds.ts`** - Update Round to use new scores type
3. **`packages/lib/utils/scores.ts`** - Rewrite utility functions for flat access
4. **`packages/api/src/lib/catalog.ts`** - Update import logic for ArangoDB data
5. **`packages/app/src/hooks/useScoreManagement.ts`** - Update scoring logic
6. **`packages/app/src/hooks/useCurrentHoleScores.ts`** - Update score access
7. **Components using scores** - Update to new access pattern

### Related Consideration: Lists vs Maps for Holes

The codebase currently uses both:
- `ListOfGameHoles` - List for game holes (preserves play order)
- `ListOfTeeHoles` - List for tee hole data
- `MapOfScores` (now `RoundScores`) - Record keyed by hole index

**Question**: Should we also convert `ListOfGameHoles` and `ListOfTeeHoles` to records?

**Decision**: Keep lists for holes where order matters for iteration (displaying holes in sequence). Use records for scores where direct access by hole number is primary.

## Usage Examples

### Setting a Score

```typescript
// Get or create HoleScores for hole 5 (1-indexed)
const holeNum = "5";
if (!round.scores[holeNum]) {
  round.scores.$jazz.set(holeNum, HoleScores.create({}, { owner }));
}

// Set gross score
round.scores[holeNum].$jazz.set("gross", "4");

// Log to history (create feed if needed)
if (!round.$jazz.has("history")) {
  round.$jazz.set("history", ScoreHistory.create([], { owner }));
}
round.history!.$jazz.push(
  ScoreChange.create({
    hole: holeNum,
    key: "gross",
    value: "4",
    prev: oldValue,
  }, { owner })
);
```

### Reading a Score

```typescript
// Access hole 5's gross score (1-indexed, matches what golfers see)
const gross = round.scores["5"]?.gross;
const grossNum = gross ? parseInt(gross, 10) : null;
```

### Reading History (Lazy)

```typescript
// Only load history when user requests it
const loadedRound = await round.$jazz.ensureLoaded({
  resolve: { history: true }
});

// Iterate all changes
for (const entry of loadedRound.history ?? []) {
  console.log(`${entry.key}: ${entry.prev} → ${entry.value}`);
  console.log(`  at: ${entry.$jazz.createdAt}`);
  console.log(`  by: ${entry.$jazz.by}`); // account that wrote it
}
```

## Decisions

1. **Batch history writes?** No - write immediately. Revisit if performance becomes an issue.

2. **History for imports?** Skip history for ArangoDB imports (unless it exists and is easy). Historical timestamps wouldn't be accurate anyway.

3. **Hole index format?** Use "1"-"18" (golfer-friendly, 1-indexed). Supports extra holes for certain games: "19", "20", etc.

## Next Steps

1. Finalize schema design (this doc)
2. Create implementation plan
3. Use orchestrator for multi-file changes
4. Update tests
5. Run quality checks
