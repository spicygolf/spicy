/**
 * Gross Scores Stage
 *
 * Extracts gross scores from rounds and populates the scoreboard.
 * Also calculates score-to-par values.
 */

import { deepClone } from "../../utils/clone";
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
  const { scoreboard, rounds, gameHoles } = ctx;

  // Deep clone scoreboard to maintain immutability
  const newScoreboard = deepClone(scoreboard);

  for (const gameHole of gameHoles) {
    const holeNum = gameHole.hole;
    const holeResult = newScoreboard.holes[holeNum];

    if (!holeResult) continue;

    const par = holeResult.holeInfo.par;

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
        holeResult.players[playerId].hasScore = true;
        holeResult.players[playerId].gross = gross;
        holeResult.players[playerId].scoreToPar = gross - par;
      }
    }
  }

  return {
    ...ctx,
    scoreboard: newScoreboard,
  };
}
