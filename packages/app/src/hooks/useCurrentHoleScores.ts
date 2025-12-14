import { useCoState } from "jazz-tools/react-native";
import { RoundToGame } from "spicylib/schema";

interface UseCurrentHoleScoresOptions {
  roundToGameId: string;
  currentHoleIndex: number;
  resolve?: Record<string, unknown>;
}

/**
 * Hook to load score data for a specific round with customizable resolve.
 *
 * @param options - Configuration options
 * @param options.roundToGameId - RoundToGame ID to load
 * @param options.currentHoleIndex - Current hole index (0-indexed for array access)
 * @param options.resolve - Custom Jazz resolve query (overrides default)
 *
 * @example
 * // Load round with scores for scoring UI
 * const data = useCurrentHoleScores({
 *   roundToGameId: "...",
 *   currentHoleIndex: 0,
 *   resolve: {
 *     round: {
 *       scores: true,
 *       tee: { holes: { $each: true } }
 *     }
 *   }
 * });
 */
export function useCurrentHoleScores(options: UseCurrentHoleScoresOptions) {
  const { roundToGameId, currentHoleIndex, resolve } = options;

  const resolveQuery = resolve || {
    round: {
      scores: true,
      tee: {
        holes: {
          $each: true,
        },
      },
    },
  };

  const roundToGame = useCoState(RoundToGame, roundToGameId, {
    resolve: resolveQuery,
    select: (value) => {
      if (!value.$isLoaded) {
        return value.$jazz.loadingState === "loading" ? undefined : null;
      }
      if (!value.$jazz.has("round") || !value.round?.$isLoaded)
        return undefined;
      return value;
    },
  });

  if (!roundToGame?.$isLoaded) {
    return null;
  }

  const round = roundToGame.round;
  if (!round?.$isLoaded) {
    return null;
  }

  // Convert 0-indexed hole to 1-indexed string for score lookup
  const holeNum = String(currentHoleIndex + 1);
  const holeScores = round.scores?.$isLoaded ? round.scores[holeNum] : null;

  return {
    roundToGame,
    round,
    holeScores: holeScores?.$isLoaded ? holeScores : null,
  };
}
