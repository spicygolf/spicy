import { useCallback, useState } from "react";
import type { Game, GameHole } from "spicylib/schema";
import {
  DEFAULT_HANDICAP_ALLOCATION,
  DEFAULT_PAR,
  DEFAULT_YARDS,
} from "@/constants/golf";

export interface HoleInfo {
  number: string;
  par: number;
  yards: number;
  handicap: number;
}

export interface UseHoleNavigationReturn {
  currentHoleIndex: number;
  currentHole: GameHole | null;
  currentHoleId: string | undefined;
  currentHoleNumber: string;
  holeInfo: HoleInfo | null;
  holesList: string[];
  handlePrevHole: () => void;
  handleNextHole: () => void;
}

export function useHoleNavigation(game: Game | null): UseHoleNavigationReturn {
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);

  // Jazz provides reactive updates - no useMemo needed (jazz.xml)
  let holesList: string[] = [];
  if (game?.holes?.$isLoaded) {
    holesList = game.holes
      .map((h) => (h?.$isLoaded ? h.hole : null))
      .filter(Boolean) as string[];
  }

  // Direct access to Jazz data - Jazz reactivity handles updates
  let currentHole: GameHole | null = null;
  if (game?.holes?.$isLoaded && currentHoleIndex < game.holes.length) {
    const hole = game.holes[currentHoleIndex];
    currentHole = hole?.$isLoaded ? hole : null;
  }

  const currentHoleNumber = currentHole?.hole || "1";
  const currentHoleId = currentHole?.$isLoaded
    ? currentHole.$jazz.id
    : undefined;

  // Get hole info from first player's tee - but only if ALL players have course/tee selected
  let holeInfo: HoleInfo | null = null;
  if (game?.rounds?.$isLoaded && game.rounds.length > 0) {
    // Check that ALL players have course and tee selected
    const allPlayersHaveSelections = game.rounds.every((rtg) => {
      if (!rtg?.$isLoaded) return false;
      const round = rtg.round;
      if (!round?.$isLoaded) return false;
      return round.$jazz.has("course") && round.$jazz.has("tee");
    });

    // Only proceed if all players have selections
    if (allPlayersHaveSelections) {
      const firstRoundToGame = game.rounds[0];
      if (firstRoundToGame?.$isLoaded) {
        const round = firstRoundToGame.round;
        if (round?.$isLoaded && round.$jazz.has("tee")) {
          const tee = round.tee;
          if (tee?.$isLoaded && tee.holes?.$isLoaded) {
            const hole = tee.holes.find(
              (h) => h?.$isLoaded && h.number?.toString() === currentHoleNumber,
            );

            if (hole?.$isLoaded) {
              holeInfo = {
                number: currentHoleNumber,
                par: hole.par ?? DEFAULT_PAR,
                yards: hole.yards ?? DEFAULT_YARDS,
                handicap: hole.handicap ?? DEFAULT_HANDICAP_ALLOCATION,
              };
            }
          }
        }
      }
    }
  }

  const handlePrevHole = useCallback(() => {
    setCurrentHoleIndex((prev) => {
      if (prev === 0) return holesList.length - 1;
      return prev - 1;
    });
  }, [holesList.length]);

  const handleNextHole = useCallback(() => {
    setCurrentHoleIndex((prev) => {
      if (prev === holesList.length - 1) return 0;
      return prev + 1;
    });
  }, [holesList.length]);

  return {
    currentHoleIndex,
    currentHole,
    currentHoleId,
    currentHoleNumber,
    holeInfo,
    holesList,
    handlePrevHole,
    handleNextHole,
  };
}
