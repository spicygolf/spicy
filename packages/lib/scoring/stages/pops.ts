/**
 * Pops Stage
 *
 * Calculates pops (strokes received/given) for each player on each hole.
 * Uses the existing calculatePops utility from scores.ts.
 */

import { calculatePops as calculatePopsForHole } from "../../utils/scores";
import type { ScoringContext } from "../types";

/**
 * Calculate pops for all players on all holes
 *
 * Pops are the strokes received (positive handicap) or given (plus handicap)
 * based on the player's course handicap and the hole's handicap allocation.
 *
 * @param ctx - Scoring context with gross scores populated
 * @returns Updated context with pops calculated
 */
export function calculatePops(ctx: ScoringContext): ScoringContext {
  const { scoreboard, playerHandicaps, holeInfo, holes } = ctx;

  // Deep clone scoreboard to maintain immutability
  const newScoreboard = structuredClone(scoreboard);

  for (const gameHole of holes) {
    const holeNum = gameHole.hole;
    const holeResult = newScoreboard.holes[holeNum];
    const hole = holeInfo.get(holeNum);

    if (!holeResult || !hole) continue;

    for (const [playerId, playerResult] of Object.entries(holeResult.players)) {
      const handicapInfo = playerHandicaps.get(playerId);

      if (!handicapInfo) continue;

      // Calculate pops using existing utility
      const pops = calculatePopsForHole(
        handicapInfo.effectiveHandicap,
        hole.handicapAllocation,
      );

      playerResult.pops = pops;
    }
  }

  return {
    ...ctx,
    scoreboard: newScoreboard,
  };
}
