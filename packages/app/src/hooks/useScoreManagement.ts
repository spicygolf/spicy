import { useCallback } from "react";
import type { Game } from "spicylib/schema";
import {
  adjustHandicapsToLow,
  calculateCourseHandicap,
  calculatePops,
  getEffectiveHandicap,
  removeGrossScore,
  setGrossScore,
  setPops,
} from "spicylib/utils";
import type { HoleInfo } from "./useHoleNavigation";
import { useOptionValue } from "./useOptionValue";

export interface UseScoreManagementReturn {
  handleScoreChange: (roundToGameId: string, newGross: number) => void;
  handleUnscore: (roundToGameId: string) => void;
}

export function useScoreManagement(
  game: Game | null,
  currentHoleIndex: number,
  holeInfo: HoleInfo | null,
): UseScoreManagementReturn {
  // Check if handicaps are used in this game
  const useHandicapsValue = useOptionValue(game, null, "use_handicaps", "game");
  const useHandicaps =
    useHandicapsValue === "true" || useHandicapsValue === "1";

  // Get handicap mode from game options (no hole-level override for this option)
  const handicapIndexFromValue = useOptionValue(
    game,
    null,
    "handicap_index_from",
    "game",
  );
  const handicapMode = handicapIndexFromValue === "low" ? "low" : "full";

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

      // Get owner from round for creating HoleScores if needed
      const owner = round.$jazz.owner;

      // Set gross score
      // trackHistory = true for live scoring
      setGrossScore(round, holeNum, newGross, owner, true);

      // Calculate and set pops only if handicaps are used
      if (useHandicaps) {
        // Helper to get course handicap (stored or calculated from tee)
        const getCourseHandicap = (
          rtg: (typeof game.rounds)[number],
        ): number => {
          if (!rtg?.$isLoaded || !rtg.round?.$isLoaded) return 0;

          // Use stored courseHandicap if available
          if (rtg.courseHandicap !== undefined) {
            return rtg.courseHandicap;
          }

          // Calculate from tee data
          const r = rtg.round;
          if (r.$jazz.has("tee") && r.tee?.$isLoaded) {
            const handicapIndex = rtg.handicapIndex || r.handicapIndex;
            const calculated = calculateCourseHandicap({
              handicapIndex,
              tee: r.tee,
              holesPlayed: "all18",
            });
            return calculated ?? 0;
          }

          return 0;
        };

        let handicapForPops: number;

        if (handicapMode === "low") {
          // Build player handicaps and adjust to low
          const playerHandicaps = [];
          for (const rtg of game.rounds as Iterable<
            (typeof game.rounds)[number]
          >) {
            if (!rtg?.$isLoaded || !rtg.round?.$isLoaded) continue;

            playerHandicaps.push({
              playerId: rtg.round.playerId,
              courseHandicap: getCourseHandicap(rtg),
              gameHandicap: rtg.gameHandicap,
            });
          }

          const adjustedHandicaps = adjustHandicapsToLow(playerHandicaps);
          handicapForPops = adjustedHandicaps.get(round.playerId) ?? 0;
        } else {
          // Use full course handicap (or game handicap if set)
          const courseHandicap = getCourseHandicap(roundToGame);
          handicapForPops = getEffectiveHandicap(
            courseHandicap,
            roundToGame.gameHandicap,
          );
        }

        const pops = calculatePops(handicapForPops, holeInfo.handicap);
        setPops(round, holeNum, pops, owner, true);
      }
    },
    [game, currentHoleIndex, holeInfo, useHandicaps, handicapMode],
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
