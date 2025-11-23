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
 * Calculate pops (strokes received) based on course handicap and hole allocation
 * Returns 1 if player receives a stroke on this hole, 0 otherwise
 */
export function calculatePops(
  courseHandicap: number,
  holeAllocation: number,
): number {
  return courseHandicap >= holeAllocation ? 1 : 0;
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
