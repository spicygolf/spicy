import { useCallback } from "react";
import {
  type Game,
  ListOfScoreUpdate,
  ListOfValues,
  Score,
} from "spicylib/schema";
import {
  calculatePops,
  getEffectiveHandicap,
  removeGrossScore,
  setGrossScore,
  setPops,
} from "spicylib/utils";
import type { HoleInfo } from "./useHoleNavigation";

export interface UseScoreManagementReturn {
  handleScoreChange: (roundToGameId: string, newGross: number) => void;
  handleUnscore: (roundToGameId: string) => void;
}

export function useScoreManagement(
  game: Game | null,
  currentHoleIndex: number,
  holeInfo: HoleInfo | null,
): UseScoreManagementReturn {
  const handleScoreChange = useCallback(
    (roundToGameId: string, newGross: number) => {
      if (!game?.rounds?.$isLoaded || !holeInfo) {
        return;
      }

      // Find the RoundToGame by ID
      const roundToGame = game.rounds.find(
        (rtg) => rtg?.$isLoaded && rtg.$jazz.id === roundToGameId,
      );

      if (!roundToGame?.$isLoaded) {
        return;
      }

      const round = roundToGame.round;
      if (!round?.$isLoaded || !round.scores?.$isLoaded) {
        return;
      }

      // Use string key for MapOfScores access
      const holeKey = String(currentHoleIndex);

      // Get or create score for this hole
      let score = round.scores[holeKey];

      // If score doesn't exist, create it
      if (!score || !score.$isLoaded) {
        const newScore = Score.create(
          {
            seq: currentHoleIndex,
            values: ListOfValues.create([], { owner: round.$jazz.owner }),
            history: ListOfScoreUpdate.create([], {
              owner: round.$jazz.owner,
            }),
          },
          { owner: round.$jazz.owner },
        );

        // Set score in map using string key
        round.scores.$jazz.set(holeKey, newScore);
        score = newScore;
      }

      // Calculate pops based on effective handicap
      // Priority: gameHandicap > courseHandicap
      // TODO: Once we implement "low" handicap mode, this will need to adjust
      const courseHandicap = roundToGame.courseHandicap ?? 0;
      const effectiveHandicap = getEffectiveHandicap(
        courseHandicap,
        roundToGame.gameHandicap,
      );
      const pops = calculatePops(effectiveHandicap, holeInfo.handicap);

      // Set gross and pops (score is guaranteed to be loaded at this point)
      if (score.$isLoaded) {
        setGrossScore(score, newGross, round.playerId, round.$jazz.owner);
        setPops(score, pops, round.playerId, round.$jazz.owner);
      }
    },
    [game, currentHoleIndex, holeInfo],
  );

  const handleUnscore = useCallback(
    (roundToGameId: string) => {
      if (!game?.rounds?.$isLoaded) {
        return;
      }

      // Find the RoundToGame by ID
      const roundToGame = game.rounds.find(
        (rtg) => rtg?.$isLoaded && rtg.$jazz.id === roundToGameId,
      );

      if (!roundToGame?.$isLoaded) {
        return;
      }

      const round = roundToGame.round;
      if (!round?.$isLoaded || !round.scores?.$isLoaded) {
        return;
      }

      // Use string key for MapOfScores access
      const holeKey = String(currentHoleIndex);

      // Get score for this hole
      const score = round.scores[holeKey];

      if (!score?.$isLoaded) {
        return;
      }

      // Remove the gross score (and pops)
      removeGrossScore(score);
    },
    [game, currentHoleIndex],
  );

  return {
    handleScoreChange,
    handleUnscore,
  };
}
