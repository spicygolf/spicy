import type { Score } from "../schema/scores";

/**
 * Get a value from a score's values list by key (e.g., "gross", "pops", "net")
 */
export function getScoreValue(score: Score | null, key: string): string | null {
  if (!score?.$isLoaded || !score.values?.$isLoaded) {
    return null;
  }

  const value = score.values.find((v) => v?.$isLoaded && v.k === key);
  return value?.$isLoaded ? value.v : null;
}

/**
 * Get a numeric score value, returning null if not found or invalid
 */
export function getScoreValueAsNumber(
  score: Score | null,
  key: string,
): number | null {
  const value = getScoreValue(score, key);
  if (value === null) return null;

  const num = Number.parseInt(value, 10);
  return Number.isNaN(num) ? null : num;
}

/**
 * Calculate net score from gross and pops (strokes received)
 */
export function calculateNetScore(gross: number, pops: number): number {
  return gross - pops;
}

/**
 * Calculate pops (strokes received/given) based on course handicap and hole allocation
 *
 * Positive handicaps (e.g., 12): Player receives strokes on hardest holes
 * - Handicap 12 gets 1 stroke on holes with allocation 1-12
 * - Returns: 1 (stroke received)
 *
 * Negative/Plus handicaps (e.g., -4 for +4): Player gives strokes to course on easiest holes
 * - Handicap -4 gives stroke on holes with allocation 15-18 (18 - 4 + 1 = 15)
 * - Returns: -1 (stroke given)
 *
 * @param courseHandicap - The player's course handicap (negative for plus handicaps)
 * @param holeAllocation - The hole's handicap index (1=hardest, 18=easiest)
 * @returns Number of strokes: 1 (received), 0 (none), -1 (given to course)
 *
 * @example
 * calculatePops(12, 5)  // 12 >= 5 → 1 stroke received
 * calculatePops(12, 15) // 12 < 15 → 0 strokes
 * calculatePops(-4, 17) // 17 > (18 - 4) → -1 stroke given to course
 * calculatePops(-4, 14) // 14 <= (18 - 4) → 0 strokes
 */
export function calculatePops(
  courseHandicap: number,
  holeAllocation: number,
): number {
  // Positive handicaps: receive strokes on hardest holes
  if (courseHandicap > 0) {
    return courseHandicap >= holeAllocation ? 1 : 0;
  }

  // Negative/Plus handicaps: give strokes to course on easiest holes
  if (courseHandicap < 0) {
    const absHandicap = Math.abs(courseHandicap);
    // Give strokes on holes where allocation > (18 - absHandicap)
    // e.g., +4 (-4) gives on holes 15,16,17,18 (allocation > 14)
    return holeAllocation > 18 - absHandicap ? -1 : 0;
  }

  // Zero handicap: scratch player, no strokes
  return 0;
}

/**
 * Get gross score as number, returns null if not found
 */
export function getGrossScore(score: Score | null): number | null {
  return getScoreValueAsNumber(score, "gross");
}

/**
 * Get pops (strokes received) as number, returns 0 if not found
 */
export function getPops(score: Score | null): number {
  return getScoreValueAsNumber(score, "pops") ?? 0;
}

/**
 * Get net score from a score object, calculating from gross and pops
 */
export function getNetScore(score: Score | null): number | null {
  const gross = getGrossScore(score);
  if (gross === null) return null;

  const pops = getPops(score);
  return calculateNetScore(gross, pops);
}

/**
 * Calculate score-to-par (e.g., -1 for birdie, 0 for par, +1 for bogey)
 */
export function getScoreToPar(score: number, par: number): number {
  return score - par;
}

/**
 * Get score-to-par descriptor (e.g., "Eagle", "Birdie", "Par", "Bogey")
 */
export function getScoreToParName(scoreToPar: number): string {
  if (scoreToPar <= -3) return "Albatross";
  if (scoreToPar === -2) return "Eagle";
  if (scoreToPar === -1) return "Birdie";
  if (scoreToPar === 0) return "Par";
  if (scoreToPar === 1) return "Bogey";
  if (scoreToPar === 2) return "Double Bogey";
  if (scoreToPar === 3) return "Triple Bogey";
  return `+${scoreToPar}`;
}

/**
 * Set a value in a score's values list, creating or updating as needed
 * This function modifies the score object in place
 */
export function setScoreValue(
  score: Score,
  key: string,
  value: string,
  playerId: string,
  owner: { id: string },
): void {
  if (!score.$isLoaded) {
    throw new Error("Score must be loaded before setting values");
  }

  if (!score.values?.$isLoaded) {
    throw new Error("Score values must be loaded before setting values");
  }

  // Find existing value with this key
  const existingIndex = score.values.findIndex(
    (v) => v?.$isLoaded && v.k === key,
  );

  // Import at runtime to avoid circular dependencies
  const { Value } = require("../schema/scores");

  // Create new value
  const newValue = Value.create(
    {
      k: key,
      v: value,
      byPlayerId: playerId,
      at: new Date(),
    },
    { owner },
  );

  if (existingIndex >= 0) {
    // Update existing value - MUST use $jazz.set
    score.values.$jazz.set(existingIndex, newValue);
  } else {
    // Add new value
    score.values.$jazz.push(newValue);
  }
}

/**
 * Update gross score for a score object
 */
export function setGrossScore(
  score: Score,
  gross: number,
  playerId: string,
  owner: { id: string },
): void {
  setScoreValue(score, "gross", gross.toString(), playerId, owner);
}

/**
 * Update pops (strokes received) for a score object
 */
export function setPops(
  score: Score,
  pops: number,
  playerId: string,
  owner: { id: string },
): void {
  setScoreValue(score, "pops", pops.toString(), playerId, owner);
}

/**
 * Remove a value from a score's values list by key
 * This effectively "unscores" a hole for that value type
 */
export function removeScoreValue(score: Score, key: string): void {
  if (!score.$isLoaded) {
    throw new Error("Score must be loaded before removing values");
  }

  if (!score.values?.$isLoaded) {
    throw new Error("Score values must be loaded before removing values");
  }

  // Find existing value with this key
  const existingIndex = score.values.findIndex(
    (v) => v?.$isLoaded && v.k === key,
  );

  if (existingIndex >= 0) {
    // Remove the value using Jazz remove method
    score.values.$jazz.remove(existingIndex);
  }
}

/**
 * Remove gross score from a score object (unscores the hole)
 */
export function removeGrossScore(score: Score): void {
  removeScoreValue(score, "gross");
  // Also remove pops when unscoring to keep data clean
  removeScoreValue(score, "pops");
}
