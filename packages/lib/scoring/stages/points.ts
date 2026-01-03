/**
 * Points Stage
 *
 * Calculates points for players and teams based on junk awards and multipliers.
 * This is a data-driven stage - points come from junk option values.
 */

import { deepClone } from "../../utils/clone";
import { calculateTotalMultiplier } from "../multiplier-engine";
import type { MultiplierAward, ScoringContext } from "../types";

/**
 * Calculate points for all holes
 *
 * Points are calculated as:
 * total_points = sum(junk.value) * holeMultiplier
 *
 * IMPORTANT: In team games like Five Points, multipliers are HOLE-WIDE.
 * All multipliers from all teams are combined into a single holeMultiplier
 * that applies to all teams' points equally. This matches app-0.3 behavior.
 *
 * For individual games, points come from player-scoped junk with player multipliers.
 *
 * @param ctx - Scoring context with junk and multipliers evaluated
 * @returns Updated context with points calculated
 */
export function calculatePoints(ctx: ScoringContext): ScoringContext {
  const { scoreboard, gameHoles } = ctx;

  // Deep clone scoreboard to maintain immutability
  const newScoreboard = deepClone(scoreboard);

  for (const gameHole of gameHoles) {
    const holeNum = gameHole.hole;
    const holeResult = newScoreboard.holes[holeNum];

    if (!holeResult) continue;

    // Collect ALL multipliers from ALL teams on this hole
    // In Five Points (and similar games), multipliers are hole-wide
    const allTeamMultipliers: MultiplierAward[] = [];
    for (const teamResult of Object.values(holeResult.teams)) {
      allTeamMultipliers.push(...teamResult.multipliers);
    }

    // Calculate the hole-wide multiplier (all multipliers stack multiplicatively)
    const holeMultiplier = calculateTotalMultiplier(allTeamMultipliers);

    // Store the hole multiplier on the hole result for reference
    holeResult.holeMultiplier = holeMultiplier;

    // Calculate team points using the hole-wide multiplier
    for (const teamResult of Object.values(holeResult.teams)) {
      // Sum team junk values (low_ball, low_total, etc.)
      const teamJunkPoints = teamResult.junk.reduce(
        (sum, j) => sum + j.value,
        0,
      );

      // Sum player junk values for players on this team (prox, birdie, etc.)
      // Player junk contributes to team points in team games
      let playerJunkPoints = 0;
      for (const playerId of teamResult.playerIds) {
        const playerResult = holeResult.players[playerId];
        if (playerResult) {
          playerJunkPoints += playerResult.junk.reduce(
            (sum, j) => sum + j.value,
            0,
          );
        }
      }

      // Final points = (team junk + player junk) * holeMultiplier
      // Note: All teams get multiplied by the same holeMultiplier
      teamResult.points = (teamJunkPoints + playerJunkPoints) * holeMultiplier;
    }

    // Calculate player points (for individual games or player-specific tracking)
    for (const playerResult of Object.values(holeResult.players)) {
      // Sum junk values
      const junkPoints = playerResult.junk.reduce((sum, j) => sum + j.value, 0);

      // Calculate multiplier (player multipliers for individual games)
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
