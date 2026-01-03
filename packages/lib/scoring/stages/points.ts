/**
 * Points Stage
 *
 * Calculates points for players and teams based on junk awards and multipliers.
 * This is a data-driven stage - points come from junk option values.
 */

import { calculateTotalMultiplier } from "../multiplier-engine";
import type { ScoringContext } from "../types";

/**
 * Calculate points for all holes
 *
 * Points are calculated as:
 * total_points = sum(junk.value) * product(multiplier.value)
 *
 * For team games, points come from team-scoped junk (low_ball, low_total, etc.)
 * For individual games, points come from player-scoped junk.
 *
 * @param ctx - Scoring context with junk and multipliers evaluated
 * @returns Updated context with points calculated
 */
export function calculatePoints(ctx: ScoringContext): ScoringContext {
  const { scoreboard, gameHoles } = ctx;

  // Deep clone scoreboard to maintain immutability
  const newScoreboard = structuredClone(scoreboard);

  for (const gameHole of gameHoles) {
    const holeNum = gameHole.hole;
    const holeResult = newScoreboard.holes[holeNum];

    if (!holeResult) continue;

    // Calculate team points
    for (const teamResult of Object.values(holeResult.teams)) {
      // Sum junk values
      const junkPoints = teamResult.junk.reduce((sum, j) => sum + j.value, 0);

      // Calculate multiplier
      const multiplier = calculateTotalMultiplier(teamResult.multipliers);

      // Final points
      teamResult.points = junkPoints * multiplier;
    }

    // Calculate player points (for individual games or player-specific tracking)
    for (const playerResult of Object.values(holeResult.players)) {
      // Sum junk values
      const junkPoints = playerResult.junk.reduce((sum, j) => sum + j.value, 0);

      // Calculate multiplier
      const multiplier = calculateTotalMultiplier(playerResult.multipliers);

      // Final points
      playerResult.points = junkPoints * multiplier;
    }
  }

  return {
    ...ctx,
    scoreboard: newScoreboard,
  };
}
