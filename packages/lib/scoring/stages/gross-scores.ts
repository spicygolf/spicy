/**
 * Gross Scores Stage
 *
 * Extracts gross scores from rounds and populates the scoreboard.
 */

import { getGrossScore } from "../../utils/scores";
import type { ScoringContext } from "../types";

/**
 * Calculate gross scores for all players on all holes
 *
 * Reads gross scores from each player's round and populates
 * the scoreboard hole results.
 *
 * @param ctx - Scoring context with initialized scoreboard
 * @returns Updated context with gross scores populated
 */
export function calculateGrossScores(ctx: ScoringContext): ScoringContext {
  const { scoreboard, rounds, holes } = ctx;

  // Deep clone scoreboard to maintain immutability
  const newScoreboard = structuredClone(scoreboard);

  for (const gameHole of holes) {
    const holeNum = gameHole.hole;
    const holeResult = newScoreboard.holes[holeNum];

    if (!holeResult) continue;

    for (const rtg of rounds) {
      // Check if RoundToGame is loaded
      if (!rtg?.$isLoaded) continue;

      const round = rtg.round;
      // Check if Round is loaded
      if (!round?.$isLoaded) continue;

      const playerId = round.playerId;
      if (!playerId || !holeResult.players[playerId]) continue;

      // Get gross score from round
      const gross = getGrossScore(round, holeNum);

      if (gross !== null) {
        holeResult.players[playerId].gross = gross;
      }
    }
  }

  return {
    ...ctx,
    scoreboard: newScoreboard,
  };
}
