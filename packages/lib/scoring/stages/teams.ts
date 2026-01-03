/**
 * Teams Stage
 *
 * Handles team assignment and team score calculation.
 * Teams are read from GameHole.teams for each hole.
 */

import type { FivePointsTeamScore, ScoringContext } from "../types";

/**
 * Calculate team scores for all holes
 *
 * Team scoring varies by game type. This stage calculates the basic
 * team structure (which players are on which team) and prepares for
 * game-specific scoring.
 *
 * @param ctx - Scoring context with player net scores calculated
 * @returns Updated context with team data populated
 */
export function assignTeams(ctx: ScoringContext): ScoringContext {
  // Teams are already initialized in the scoreboard during initialize stage
  // based on teamsPerHole. This stage just ensures team player mappings are set.
  // The actual team scores will be calculated in game-specific stages.

  return ctx;
}

/**
 * Calculate Five Points team scores for a hole
 *
 * Five Points uses:
 * - Low ball: lowest net score on the team
 * - Total: sum of both players' net scores
 *
 * @param playerIds - Player IDs on the team
 * @param playerResults - Player results for this hole
 * @returns Team score breakdown
 */
export function calculateFivePointsTeamScore(
  playerIds: string[],
  playerResults: Record<string, { net: number }>,
): FivePointsTeamScore {
  const nets: number[] = [];

  for (const playerId of playerIds) {
    const result = playerResults[playerId];
    if (result && result.net > 0) {
      nets.push(result.net);
    }
  }

  if (nets.length === 0) {
    return { lowBall: 0, total: 0 };
  }

  return {
    lowBall: Math.min(...nets),
    total: nets.reduce((sum, n) => sum + n, 0),
  };
}

/**
 * Calculate best ball team score (lowest net on team)
 *
 * @param playerIds - Player IDs on the team
 * @param playerResults - Player results for this hole
 * @returns Best ball score (lowest net)
 */
export function calculateBestBall(
  playerIds: string[],
  playerResults: Record<string, { net: number }>,
): number {
  let best = Number.POSITIVE_INFINITY;

  for (const playerId of playerIds) {
    const result = playerResults[playerId];
    if (result && result.net > 0 && result.net < best) {
      best = result.net;
    }
  }

  return best === Number.POSITIVE_INFINITY ? 0 : best;
}

/**
 * Calculate aggregate team score (sum of all nets)
 *
 * @param playerIds - Player IDs on the team
 * @param playerResults - Player results for this hole
 * @returns Aggregate score (sum of nets)
 */
export function calculateAggregate(
  playerIds: string[],
  playerResults: Record<string, { net: number }>,
): number {
  let total = 0;

  for (const playerId of playerIds) {
    const result = playerResults[playerId];
    if (result && result.net > 0) {
      total += result.net;
    }
  }

  return total;
}
