/**
 * Junk Stage
 *
 * Evaluates and awards junk to players and teams.
 * Uses the junk-engine for data-driven evaluation.
 */

import { deepClone } from "../../utils/clone";
import { evaluateJunkForHole } from "../junk-engine";
import type { ScoringContext } from "../types";

/**
 * Evaluate junk for all holes
 *
 * This stage evaluates all junk options from the game spec/options
 * and awards them to players and teams based on the junk rules.
 *
 * Junk types:
 * - Player-scoped: birdie, eagle, sandie, greenie (score_to_par or user-entered)
 * - Team-scoped: low_ball, low_total, outright_winner (calculation or logic-based)
 *
 * @param ctx - Scoring context with rankings calculated
 * @returns Updated context with junk awards
 */
export function evaluateJunk(ctx: ScoringContext): ScoringContext {
  const { scoreboard, gameHoles } = ctx;

  // Deep clone scoreboard to maintain immutability
  const newScoreboard = deepClone(scoreboard);

  for (const gameHole of gameHoles) {
    const holeNum = gameHole.hole;
    const holeResult = newScoreboard.holes[holeNum];

    if (!holeResult) continue;

    // Evaluate junk for this hole (even without scores, user-marked junk like
    // prox can exist and we need warnings to fire for incomplete scoring)
    const updatedHoleResult = evaluateJunkForHole(holeResult, ctx);

    // Update the scoreboard
    newScoreboard.holes[holeNum] = updatedHoleResult;
  }

  return {
    ...ctx,
    scoreboard: newScoreboard,
  };
}
