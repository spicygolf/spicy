import { useMemo } from "react";
import type { Game } from "spicylib/schema";
import type { Scoreboard, ScoringContext } from "spicylib/scoring";
import { scoreWithContext } from "spicylib/scoring";

/**
 * Result from the useScoreboard hook
 */
export interface ScoreboardResult {
  /** The calculated scoreboard with all hole results */
  scoreboard: Scoreboard;
  /** The full scoring context (needed for availability checks) */
  context: ScoringContext;
}

/**
 * Hook to calculate the scoreboard for a game using the scoring engine.
 *
 * The scoring engine calculates:
 * - Player junk (birdie, eagle) based on score_to_par conditions
 * - Team junk (low_ball, low_team) based on calculation rules
 * - Points, rankings, and cumulative totals
 *
 * The scoreboard is memoized and only recalculated when game data changes.
 *
 * @param game - The fully loaded game object
 * @returns The calculated scoreboard and context, or null if scoring fails
 *
 * @example
 * const result = useScoreboard(game);
 * if (result) {
 *   const holeResult = result.scoreboard.holes["1"];
 *   const playerJunk = holeResult.players[playerId].junk;
 *   const teamJunk = holeResult.teams[teamId].junk;
 * }
 */
export function useScoreboard(game: Game | null): ScoreboardResult | null {
  return useMemo(() => {
    if (!game?.$isLoaded) {
      return null;
    }

    // Check if we have the minimum required data for scoring
    if (!game.specs?.$isLoaded || game.specs.length === 0) {
      return null;
    }

    const spec = game.specs[0];
    if (!spec?.$isLoaded || !spec.options?.$isLoaded) {
      return null;
    }

    if (!game.holes?.$isLoaded || game.holes.length === 0) {
      return null;
    }

    if (!game.rounds?.$isLoaded || game.rounds.length === 0) {
      return null;
    }

    // Check that at least one round has scores
    let hasAnyScores = false;
    for (const rtg of game.rounds) {
      if (!rtg?.$isLoaded) continue;
      const round = rtg.round;
      if (!round?.$isLoaded) continue;
      if (round.scores?.$isLoaded) {
        // Check if any hole has a score
        for (const key of Object.keys(round.scores)) {
          if (key.startsWith("$") || key === "_refs") continue;
          const holeScores = round.scores[key];
          if (holeScores?.$isLoaded && holeScores.gross) {
            hasAnyScores = true;
            break;
          }
        }
      }
      if (hasAnyScores) break;
    }

    // Even without scores, we can still run the scoring engine
    // It will just return empty results for holes without scores

    try {
      // Score the game and get both scoreboard and context
      // The context is needed for evaluating multiplier availability
      const { scoreboard, context } = scoreWithContext(game);
      return { scoreboard, context };
    } catch (error) {
      // Log error but don't crash - scoring may fail if data is partially loaded
      console.warn("[useScoreboard] Scoring engine error:", error);
      return null;
    }
  }, [game]);
}
