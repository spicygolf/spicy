import { useCallback } from "react";
import type { Game } from "spicylib/schema";
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

      // Convert 0-indexed hole to 1-indexed string ("0" -> "1", "17" -> "18")
      const holeNum = String(currentHoleIndex + 1);

      // Calculate pops based on effective handicap
      // Priority: gameHandicap > courseHandicap
      const courseHandicap = roundToGame.courseHandicap ?? 0;
      const effectiveHandicap = getEffectiveHandicap(
        courseHandicap,
        roundToGame.gameHandicap,
      );
      const pops = calculatePops(effectiveHandicap, holeInfo.handicap);

      // Get owner from round for creating HoleScores if needed
      const owner = round.$jazz.owner;

      // Set gross and pops using new utility functions
      // trackHistory = true for live scoring
      setGrossScore(round, holeNum, newGross, owner, true);
      setPops(round, holeNum, pops, owner, true);
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

      // Convert 0-indexed hole to 1-indexed string
      const holeNum = String(currentHoleIndex + 1);

      // Get owner from round
      const owner = round.$jazz.owner;

      // Remove the gross score (and pops) using new utility
      // trackHistory = true for live scoring
      removeGrossScore(round, holeNum, owner, true);
    },
    [game, currentHoleIndex],
  );

  return {
    handleScoreChange,
    handleUnscore,
  };
}
