import { useCallback } from "react";
import type { Game } from "spicylib/schema";
import { calculatePops, setGrossScore, setPops } from "spicylib/utils";
import type { HoleInfo } from "./useHoleNavigation";

export interface UseScoreManagementReturn {
  handleScoreChange: (roundToGameId: string, newGross: number) => void;
}

export function useScoreManagement(
  game: Game | null,
  currentHoleIndex: number,
  holeInfo: HoleInfo | null,
): UseScoreManagementReturn {
  const handleScoreChange = useCallback(
    (roundToGameId: string, newGross: number) => {
      console.log("[GameScoring] handleScoreChange called", {
        roundToGameId,
        newGross,
        hasGame: !!game,
        roundsLoaded: game?.rounds?.$isLoaded,
        hasHoleInfo: !!holeInfo,
      });

      if (!game?.rounds?.$isLoaded || !holeInfo) {
        console.log("[GameScoring] Early return - missing data");
        return;
      }

      // Find the RoundToGame by ID
      const roundToGame = game.rounds.find(
        (rtg) => rtg?.$isLoaded && rtg.$jazz.id === roundToGameId,
      );

      if (!roundToGame?.$isLoaded) {
        console.log("[GameScoring] RoundToGame not found or not loaded");
        return;
      }

      console.log("[GameScoring] Found roundToGame", {
        id: roundToGame.$jazz.id,
        hasRound: !!roundToGame.round,
      });

      const round = roundToGame.round;
      if (!round?.$isLoaded || !round.scores?.$isLoaded) {
        console.log("[GameScoring] Round or scores not loaded");
        return;
      }

      console.log("[GameScoring] Processing score update", {
        currentHoleIndex,
        scoresLength: round.scores.length,
      });

      // Get or create score for this hole
      let score = round.scores[currentHoleIndex];

      // If score doesn't exist, create it
      if (!score || !score.$isLoaded) {
        console.log("[GameScoring] Creating new score for hole", {
          currentHoleIndex,
        });

        const { Score, ListOfValues } = require("spicylib/schema");

        const newScore = Score.create(
          {
            seq: currentHoleIndex,
            values: ListOfValues.create([], { owner: round.$jazz.owner }),
            history: require("spicylib/schema").ListOfScoreUpdate.create([], {
              owner: round.$jazz.owner,
            }),
          },
          { owner: round.$jazz.owner },
        );

        round.scores.$jazz.push(newScore);
        score = newScore;
        console.log("[GameScoring] New score created", { id: score.$jazz.id });
      }

      // Calculate pops based on course handicap
      const courseHandicap = roundToGame.courseHandicap ?? 0;
      const pops = calculatePops(courseHandicap, holeInfo.handicap);

      console.log("[GameScoring] Setting score values", {
        newGross,
        pops,
        courseHandicap,
        holeHandicap: holeInfo.handicap,
      });

      // Set gross and pops (score is guaranteed to be loaded at this point)
      if (score.$isLoaded) {
        setGrossScore(
          score,
          newGross,
          round.playerId,
          round.$jazz.owner as unknown as { id: string },
        );
        setPops(
          score,
          pops,
          round.playerId,
          round.$jazz.owner as unknown as { id: string },
        );
        console.log("[GameScoring] Score updated successfully");
      } else {
        console.log("[GameScoring] Score not loaded after creation!");
      }
    },
    [game, currentHoleIndex, holeInfo],
  );

  return {
    handleScoreChange,
  };
}
