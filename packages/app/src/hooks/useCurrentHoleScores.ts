import { useCoState } from "jazz-tools/react-native";
import { RoundToGame } from "spicylib/schema";

interface UseCurrentHoleScoresOptions {
  roundToGameId: string;
  currentHoleIndex: number;
}

/**
 * Optimized hook to load score data for a specific round
 * Only loads the round's scores map (not all score details)
 */
export function useCurrentHoleScores(options: UseCurrentHoleScoresOptions) {
  const { roundToGameId, currentHoleIndex } = options;

  // Load RoundToGame with its round and scores
  const roundToGame = useCoState(RoundToGame, roundToGameId, {
    resolve: {
      round: {
        scores: true, // Load the scores map (but scores themselves load lazily)
        tee: {
          holes: {
            $each: true, // Load tee holes for par/handicap info
          },
        },
      },
    },
  });

  if (!roundToGame?.$isLoaded) {
    return null;
  }

  const round = roundToGame.round;
  if (!round?.$isLoaded) {
    return null;
  }

  // Access the current hole's score
  const holeKey = String(currentHoleIndex);
  const score = round.scores?.$isLoaded ? round.scores[holeKey] : null;

  return {
    roundToGame,
    round,
    score: score?.$isLoaded ? score : null,
  };
}
