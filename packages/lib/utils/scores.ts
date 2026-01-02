import type { Group } from "jazz-tools";
import { HoleScores, type Round, ScoreChange, ScoreHistory } from "../schema";

/**
 * Get a value from a hole's scores by key (e.g., "gross", "pops", "net")
 * Flat access pattern: round.scores["5"]?.gross
 */
export function getScoreValue(
  round: Round | null,
  holeNum: string,
  key: string,
): string | null {
  if (!round?.$isLoaded || !round.scores?.$isLoaded) {
    return null;
  }

  const holeScores = round.scores[holeNum];
  if (!holeScores?.$isLoaded) {
    return null;
  }

  return holeScores[key] ?? null;
}

/**
 * Get a numeric score value, returning null if not found or invalid
 */
export function getScoreValueAsNumber(
  round: Round | null,
  holeNum: string,
  key: string,
): number | null {
  const value = getScoreValue(round, holeNum, key);
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
export function getGrossScore(
  round: Round | null,
  holeNum: string,
): number | null {
  return getScoreValueAsNumber(round, holeNum, "gross");
}

/**
 * Get pops (strokes received) as number, returns 0 if not found
 */
export function getPops(round: Round | null, holeNum: string): number {
  return getScoreValueAsNumber(round, holeNum, "pops") ?? 0;
}

/**
 * Get net score from a round/hole, calculating from gross and pops
 */
export function getNetScore(
  round: Round | null,
  holeNum: string,
): number | null {
  const gross = getGrossScore(round, holeNum);
  if (gross === null) return null;

  const pops = getPops(round, holeNum);
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
 * Set a value in a hole's scores, creating HoleScores if needed
 * New flat access pattern with optional history tracking
 *
 * @param round - The round to modify
 * @param holeNum - Hole number as string (1-indexed: "1"-"18")
 * @param key - Score key (e.g., "gross", "pops", "net")
 * @param value - Score value as string
 * @param owner - Jazz owner for creating new CoMaps
 * @param trackHistory - Whether to record this change in history (default: false for imports)
 */
export function setScoreValue(
  round: Round,
  holeNum: string,
  key: string,
  value: string,
  owner: Group,
  trackHistory = false,
): void {
  if (!round.$isLoaded) {
    throw new Error("Round must be loaded before setting scores");
  }

  if (!round.scores?.$isLoaded) {
    throw new Error("Round scores must be loaded before setting scores");
  }

  // Get or create HoleScores for this hole
  let holeScores = round.scores[holeNum];
  if (!holeScores?.$isLoaded) {
    holeScores = HoleScores.create({}, { owner });
    round.scores.$jazz.set(holeNum, holeScores);
  }

  // Track previous value for history
  const prev = trackHistory ? holeScores[key] : undefined;

  // Set the value
  holeScores.$jazz.set(key, value);

  // Record to history if requested
  if (trackHistory) {
    // Create history feed if it doesn't exist
    if (!round.$jazz.has("history")) {
      round.$jazz.set("history", ScoreHistory.create([], { owner }));
    }

    const history = round.history;
    if (history?.$isLoaded) {
      const change = ScoreChange.create(
        {
          hole: holeNum,
          key,
          value,
          prev,
        },
        { owner },
      );
      history.$jazz.push(change);
    }
  }
}

/**
 * Update gross score for a hole
 */
export function setGrossScore(
  round: Round,
  holeNum: string,
  gross: number,
  owner: Group,
  trackHistory = false,
): void {
  setScoreValue(round, holeNum, "gross", gross.toString(), owner, trackHistory);
}

/**
 * Update pops (strokes received) for a hole
 */
export function setPops(
  round: Round,
  holeNum: string,
  pops: number,
  owner: Group,
  trackHistory = false,
): void {
  setScoreValue(round, holeNum, "pops", pops.toString(), owner, trackHistory);
}

/**
 * Remove a value from a hole's scores
 * This effectively "unscores" that value for the hole
 */
export function removeScoreValue(
  round: Round,
  holeNum: string,
  key: string,
  owner: Group,
  trackHistory = false,
): void {
  if (!round.$isLoaded) {
    throw new Error("Round must be loaded before removing scores");
  }

  if (!round.scores?.$isLoaded) {
    throw new Error("Round scores must be loaded before removing scores");
  }

  const holeScores = round.scores[holeNum];
  if (!holeScores?.$isLoaded) {
    return; // Nothing to remove
  }

  // Track previous value for history
  const prev = trackHistory ? holeScores[key] : undefined;

  // Remove the value using Jazz delete
  holeScores.$jazz.delete(key);

  // Record to history if requested and there was a previous value
  if (trackHistory && prev !== undefined) {
    if (!round.$jazz.has("history")) {
      round.$jazz.set("history", ScoreHistory.create([], { owner }));
    }

    const history = round.history;
    if (history?.$isLoaded) {
      const change = ScoreChange.create(
        {
          hole: holeNum,
          key,
          value: "", // Empty string indicates deletion
          prev,
        },
        { owner },
      );
      history.$jazz.push(change);
    }
  }
}

/**
 * Remove gross score from a hole (unscores the hole)
 * Also removes pops when unscoring to keep data clean
 */
export function removeGrossScore(
  round: Round,
  holeNum: string,
  owner: Group,
  trackHistory = false,
): void {
  removeScoreValue(round, holeNum, "gross", owner, trackHistory);
  // Also remove pops when unscoring to keep data clean
  removeScoreValue(round, holeNum, "pops", owner, trackHistory);
}

/**
 * Check if a round has any scores recorded.
 * Returns true if at least one hole has a gross score.
 *
 * @param round - The round to check (must have scores resolved with $each: true)
 * @returns true if the round has any scores, false otherwise
 */
export function roundHasScores(round: Round | null): boolean {
  if (!round?.$isLoaded || !round.scores?.$isLoaded) {
    return false;
  }

  for (const key of Object.keys(round.scores)) {
    // Skip Jazz internal properties
    if (key.startsWith("$") || key === "_refs") continue;

    const holeScores = round.scores[key];
    if (!holeScores?.$isLoaded) continue;

    // Check if this hole has a gross score
    if (holeScores.gross !== undefined) {
      return true;
    }
  }

  return false;
}
