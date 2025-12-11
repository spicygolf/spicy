import { co, z } from "jazz-tools";

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
  hole: z.string(), // "5"
  key: z.string(), // "gross"
  value: z.string(), // "4"
  prev: z.optional(z.string()), // previous value, if any
});
export type ScoreChange = co.loaded<typeof ScoreChange>;

/**
 * ScoreHistory - Append-only feed of score changes
 * Jazz CoFeed provides: createdAt, session/account attribution, ordering
 */
export const ScoreHistory = co.feed(ScoreChange);
export type ScoreHistory = co.loaded<typeof ScoreHistory>;
