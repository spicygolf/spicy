/**
 * Multipliers Stage
 *
 * Evaluates and applies multipliers to players and teams.
 * Uses the multiplier-engine for data-driven evaluation.
 */

import { deepClone } from "../../utils/clone";
import { evaluateMultipliersForHole } from "../multiplier-engine";
import type { ScoringContext } from "../types";

/**
 * Evaluate multipliers for all holes
 *
 * This stage evaluates all multiplier options from the game spec/options
 * and applies them to players and teams based on the multiplier rules.
 *
 * Multiplier types:
 * - Automatic/BBQ: Triggered by junk (e.g., birdie_bbq when birdie is awarded)
 * - Press: User-activated during play
 *
 * @param ctx - Scoring context with junk evaluated
 * @returns Updated context with multipliers applied
 */
export function evaluateMultipliers(ctx: ScoringContext): ScoringContext {
  const { scoreboard, gameHoles } = ctx;

  // Deep clone scoreboard to maintain immutability
  const newScoreboard = deepClone(scoreboard);

  for (const gameHole of gameHoles) {
    const holeNum = gameHole.hole;
    const holeResult = newScoreboard.holes[holeNum];

    if (!holeResult) continue;

    // Note: We evaluate multipliers even for holes without scores
    // because inherited multipliers (like pre_double with rest_of_nine scope)
    // should still show the hole multiplier badge before scores are entered.

    // Evaluate multipliers for this hole
    const updatedHoleResult = evaluateMultipliersForHole(holeResult, ctx);

    // Update the scoreboard
    newScoreboard.holes[holeNum] = updatedHoleResult;
  }

  return {
    ...ctx,
    scoreboard: newScoreboard,
  };
}
