import { useCallback } from "react";
import type { Game, ListOfGames } from "spicylib/schema";

export interface DeleteGameResult {
  /** Whether the game can be deleted (always true, but rounds with scores are preserved) */
  canDelete: boolean;
  /** Whether any rounds have scores that will be preserved */
  hasRoundsWithScores: boolean;
  /** Count of rounds that have scores */
  roundsWithScoresCount: number;
  /** Count of empty rounds that will be orphaned */
  emptyRoundsCount: number;
  /** Delete the game from the games list */
  deleteGame: () => boolean;
}

/**
 * Hook to safely delete a game from the user's games list.
 *
 * Deletion behavior:
 * - Game is removed from user's games list
 * - All game-owned data (holes, teams, RoundToGame edges) is automatically cleaned up by Jazz
 * - Rounds WITH scores are preserved - they're player historical data
 * - Empty rounds (no scores) are orphaned and will be garbage collected by Jazz
 *
 * @param game - The game to delete (must have rounds resolved with scores)
 * @param games - The user's games list (me.root.games)
 */
export function useDeleteGame(
  game: Game | null | undefined,
  games: ListOfGames | null | undefined,
): DeleteGameResult {
  // Analyze rounds to determine which have scores
  const roundAnalysis = (() => {
    if (!game?.$isLoaded || !game.rounds?.$isLoaded) {
      return { withScores: 0, empty: 0 };
    }

    let withScores = 0;
    let empty = 0;

    for (const rtg of game.rounds as Iterable<(typeof game.rounds)[number]>) {
      if (!rtg?.$isLoaded || !rtg.round?.$isLoaded) {
        continue;
      }

      const round = rtg.round;
      const scores = round.scores;

      // Check if round has any scores recorded
      // Scores is a record keyed by hole number ("1", "2", etc.)
      if (scores?.$isLoaded) {
        const hasAnyScores = Object.keys(scores).some((key) => {
          // Skip Jazz internal properties
          if (key.startsWith("$") || key === "_refs") return false;
          const holeScores = scores[key];
          if (!holeScores?.$isLoaded) return false;
          // Check if any score values exist for this hole
          return Object.keys(holeScores).some(
            (k) => !k.startsWith("$") && k !== "_refs",
          );
        });

        if (hasAnyScores) {
          withScores++;
        } else {
          empty++;
        }
      } else {
        // If scores aren't loaded, assume empty
        empty++;
      }
    }

    return { withScores, empty };
  })();

  const deleteGame = useCallback(() => {
    if (!game?.$isLoaded || !games?.$isLoaded) {
      return false;
    }

    // Find the game in the list
    const idx = games.findIndex((g) => g?.$jazz?.id === game.$jazz.id);
    if (idx === -1) {
      console.warn("[useDeleteGame] Game not found in games list");
      return false;
    }

    // Remove the game from the list
    // All game-owned data (holes, teams, RoundToGame edges, options) is automatically
    // cleaned up by Jazz when the game becomes unreferenced.
    // Rounds are NOT deleted - they're player historical data referenced by the game.
    games.$jazz.splice(idx, 1);

    return true;
  }, [game, games]);

  return {
    canDelete: Boolean(game?.$isLoaded && games?.$isLoaded),
    hasRoundsWithScores: roundAnalysis.withScores > 0,
    roundsWithScoresCount: roundAnalysis.withScores,
    emptyRoundsCount: roundAnalysis.empty,
    deleteGame,
  };
}
