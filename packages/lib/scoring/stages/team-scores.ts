/**
 * Team Scores Stage
 *
 * Calculates team scores (lowBall, total) for each hole.
 * This must run after net scores are calculated but before junk evaluation.
 */

import { calculateAllTeamScores } from "../team-scoring";
import type { ScoringContext } from "../types";

/**
 * Calculate team scores for all holes
 *
 * This stage populates the lowBall and total fields on team results,
 * which are then used by junk evaluation (low_ball, low_total options).
 *
 * @param ctx - Scoring context with net scores calculated
 * @returns Updated context with team scores calculated
 */
export function calculateTeamScores(ctx: ScoringContext): ScoringContext {
  const { scoreboard, gameHoles } = ctx;

  // Deep clone scoreboard to maintain immutability
  const newScoreboard = structuredClone(scoreboard);

  for (const gameHole of gameHoles) {
    const holeNum = gameHole.hole;
    const holeResult = newScoreboard.holes[holeNum];

    if (!holeResult) continue;

    // Skip holes with no teams
    if (Object.keys(holeResult.teams).length === 0) continue;

    // Skip holes with no scores
    const hasScores = Object.values(holeResult.players).some(
      (p) => p.gross > 0,
    );
    if (!hasScores) continue;

    // Calculate team scores using net scores
    calculateAllTeamScores(holeResult, "net");
  }

  return {
    ...ctx,
    scoreboard: newScoreboard,
  };
}
