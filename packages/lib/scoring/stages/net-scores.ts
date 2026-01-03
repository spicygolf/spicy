/**
 * Net Scores Stage
 *
 * Calculates net scores (gross - pops) for each player on each hole.
 */

import type { ScoringContext } from "../types";

/**
 * Calculate net scores for all players on all holes
 *
 * Net score = gross score - pops (strokes received)
 * A positive pop (stroke received) reduces the net score.
 * A negative pop (stroke given, plus handicap) increases the net score.
 *
 * @param ctx - Scoring context with gross scores and pops calculated
 * @returns Updated context with net scores calculated
 */
export function calculateNetScores(ctx: ScoringContext): ScoringContext {
  const { scoreboard, gameHoles } = ctx;

  // Deep clone scoreboard to maintain immutability
  const newScoreboard = structuredClone(scoreboard);

  for (const gameHole of gameHoles) {
    const holeNum = gameHole.hole;
    const holeResult = newScoreboard.holes[holeNum];

    if (!holeResult) continue;

    const par = holeResult.holeInfo.par;

    for (const playerResult of Object.values(holeResult.players)) {
      // Only calculate net if we have a gross score
      if (playerResult.gross > 0) {
        playerResult.net = playerResult.gross - playerResult.pops;
        playerResult.netToPar = playerResult.net - par;
      }
    }
  }

  return {
    ...ctx,
    scoreboard: newScoreboard,
  };
}
