/**
 * Team Scoring Engine
 *
 * Generic team score calculation methods.
 * NO game-specific code - the calculation method is selected based on
 * the "calculation" field in JunkOption data:
 *
 * - best_ball: Lowest individual score on the team
 * - sum: Sum of all individual scores
 * - worst_ball: Highest individual score on the team
 * - average: Average of all individual scores
 */

import type {
  PlayerHoleResult,
  TeamScoreResult,
  TeamScoringMethod,
} from "./types";

// =============================================================================
// Public API
// =============================================================================

/**
 * Calculate team score using the specified method
 *
 * @param method - Calculation method from junk option
 * @param playerIds - Player IDs on the team
 * @param playerResults - Player results for this hole
 * @param scoreField - Which score to use ("net" or "gross")
 * @returns Complete team score result
 */
export function calculateTeamScore(
  method: TeamScoringMethod,
  playerIds: string[],
  playerResults: Record<string, PlayerHoleResult>,
  scoreField: "net" | "gross" = "net",
): TeamScoreResult {
  const scores = extractScores(playerIds, playerResults, scoreField);

  if (scores.length === 0) {
    return { score: 0, lowBall: 0, total: 0, average: 0 };
  }

  const lowBall = Math.min(...scores);
  const total = scores.reduce((sum, s) => sum + s, 0);
  const average = total / scores.length;
  const worstBall = Math.max(...scores);

  let score: number;
  switch (method) {
    case "best_ball":
      score = lowBall;
      break;
    case "sum":
      score = total;
      break;
    case "worst_ball":
      score = worstBall;
      break;
    case "average":
      score = average;
      break;
    default:
      score = lowBall; // Default to best ball
  }

  return { score, lowBall, total, average };
}

/**
 * Calculate best ball (lowest net score on team)
 *
 * @param playerIds - Player IDs on the team
 * @param playerResults - Player results for this hole
 * @param scoreField - Which score to use
 * @returns Best ball score
 */
export function calculateBestBall(
  playerIds: string[],
  playerResults: Record<string, PlayerHoleResult>,
  scoreField: "net" | "gross" = "net",
): number {
  const scores = extractScores(playerIds, playerResults, scoreField);
  if (scores.length === 0) return 0;
  return Math.min(...scores);
}

/**
 * Calculate aggregate/sum (total of all scores on team)
 *
 * @param playerIds - Player IDs on the team
 * @param playerResults - Player results for this hole
 * @param scoreField - Which score to use
 * @returns Sum of scores
 */
export function calculateAggregate(
  playerIds: string[],
  playerResults: Record<string, PlayerHoleResult>,
  scoreField: "net" | "gross" = "net",
): number {
  const scores = extractScores(playerIds, playerResults, scoreField);
  return scores.reduce((sum, s) => sum + s, 0);
}

/**
 * Calculate worst ball (highest score on team)
 *
 * @param playerIds - Player IDs on the team
 * @param playerResults - Player results for this hole
 * @param scoreField - Which score to use
 * @returns Worst ball score
 */
export function calculateWorstBall(
  playerIds: string[],
  playerResults: Record<string, PlayerHoleResult>,
  scoreField: "net" | "gross" = "net",
): number {
  const scores = extractScores(playerIds, playerResults, scoreField);
  if (scores.length === 0) return 0;
  return Math.max(...scores);
}

/**
 * Calculate average score on team
 *
 * @param playerIds - Player IDs on the team
 * @param playerResults - Player results for this hole
 * @param scoreField - Which score to use
 * @returns Average score
 */
export function calculateAverage(
  playerIds: string[],
  playerResults: Record<string, PlayerHoleResult>,
  scoreField: "net" | "gross" = "net",
): number {
  const scores = extractScores(playerIds, playerResults, scoreField);
  if (scores.length === 0) return 0;
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

// =============================================================================
// Vegas Scoring (v0.3 parity)
// =============================================================================

/**
 * Vegas scoring result
 */
export interface VegasScoreResult {
  /** The concatenated digit score (e.g., 45 for scores of 4 and 5) */
  vegasScore: number;
  /** Whether digits were flipped due to opponent birdie */
  flipped: boolean;
  /** Sorted digits used in calculation */
  digits: number[];
}

/**
 * Calculate Vegas team score (v0.3 parity)
 *
 * Vegas scoring concatenates team digits to form a score:
 * - Scores of 4 and 5 = 45 (lower digits first, so 4*10 + 5 = 45)
 * - If opponent has birdie, flip to 54 (higher digits first)
 * - birdies_cancel_flip option: if your team also has birdie, don't flip
 *
 * Matches v0.3 score.js vegasTeamScore function.
 *
 * @param playerIds - Player IDs on the team
 * @param playerResults - Player results for this hole
 * @param opponentHasBirdie - Whether opponent team has a birdie
 * @param opponentHasEagle - Whether opponent team has an eagle
 * @param teamHasBirdie - Whether this team has a birdie (for cancel logic)
 * @param teamHasEagle - Whether this team has an eagle (for cancel logic)
 * @param birdiesCancelFlip - Whether birdies cancel the flip
 * @param scoreField - Which score to use ("gross" typically for Vegas)
 * @returns Vegas score result
 */
export function calculateVegasScore(
  playerIds: string[],
  playerResults: Record<string, PlayerHoleResult>,
  opponentHasBirdie: boolean,
  opponentHasEagle: boolean,
  teamHasBirdie: boolean,
  teamHasEagle: boolean,
  birdiesCancelFlip: boolean,
  scoreField: "net" | "gross" = "gross",
): VegasScoreResult {
  // Get all scores and sort ascending (lower first = better)
  const digits = extractScores(playerIds, playerResults, scoreField).sort(
    (a, b) => a - b,
  );

  if (digits.length < 2) {
    return { vegasScore: 0, flipped: false, digits };
  }

  // Determine if we should flip (opponent birdie/eagle causes flip)
  let shouldFlip = false;

  if (opponentHasBirdie) {
    // Flip unless birdies_cancel and we also have birdie/eagle
    if (!birdiesCancelFlip || !(teamHasBirdie || teamHasEagle)) {
      shouldFlip = true;
    }
  }

  if (opponentHasEagle) {
    // Flip unless birdies_cancel and we also have eagle
    if (!birdiesCancelFlip || !teamHasEagle) {
      shouldFlip = true;
    }
  }

  // If flipping, sort descending (higher first = worse)
  if (shouldFlip) {
    digits.sort((a, b) => b - a);
  }

  // Concatenate digits: first digit * 10 + second digit
  // For 2 players: 4, 5 -> 45
  // For more players, this extends: 3, 4, 5 -> 345
  let vegasScore = 0;
  for (let i = 0; i < digits.length; i++) {
    const digit = digits[i];
    if (digit !== undefined) {
      vegasScore = vegasScore * 10 + digit;
    }
  }

  return { vegasScore, flipped: shouldFlip, digits };
}

/**
 * Count junk of a specific type for a team (helper for Vegas)
 *
 * @param playerIds - Player IDs on the team
 * @param playerResults - Player results for this hole
 * @param junkName - Name of junk to count (e.g., "birdie", "eagle")
 * @returns Count of matching junk
 */
export function countTeamJunk(
  playerIds: string[],
  playerResults: Record<string, PlayerHoleResult>,
  junkName: string,
): number {
  let count = 0;
  for (const playerId of playerIds) {
    const result = playerResults[playerId];
    if (result) {
      count += result.junk.filter((j) => j.name === junkName).length;
    }
  }
  return count;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Extract scores for players on a team
 */
function extractScores(
  playerIds: string[],
  playerResults: Record<string, PlayerHoleResult>,
  scoreField: "net" | "gross",
): number[] {
  const scores: number[] = [];

  for (const playerId of playerIds) {
    const result = playerResults[playerId];
    if (!result) continue;

    const score = scoreField === "net" ? result.net : result.gross;
    if (score > 0) {
      scores.push(score);
    }
  }

  return scores;
}

/**
 * Calculate team scores for all teams on a hole
 *
 * This populates the lowBall and total fields on team results,
 * which are used by junk evaluation (low_ball, low_total options).
 *
 * @param holeResult - The hole result to update
 * @param scoreField - Which player score to use
 * @returns Updated hole result with team scores
 */
export function calculateAllTeamScores(
  holeResult: {
    players: Record<string, PlayerHoleResult>;
    teams: Record<
      string,
      { playerIds: string[]; lowBall: number; total: number; score: number }
    >;
  },
  scoreField: "net" | "gross" = "net",
): void {
  for (const [_teamId, teamResult] of Object.entries(holeResult.teams)) {
    const scores = calculateTeamScore(
      "best_ball", // We calculate all metrics regardless
      teamResult.playerIds,
      holeResult.players,
      scoreField,
    );

    teamResult.lowBall = scores.lowBall;
    teamResult.total = scores.total;
    // Default score is best ball, but this can be overridden by game logic
    teamResult.score = scores.lowBall;
  }
}
