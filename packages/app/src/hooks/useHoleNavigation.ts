import { useCallback } from "react";
import type { Game, GameHole } from "spicylib/schema";
import {
  DEFAULT_HANDICAP_ALLOCATION,
  DEFAULT_PAR,
  DEFAULT_YARDS,
} from "@/constants/golf";
import { useGameContext } from "@/contexts/GameContext";

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
  /** Whether the current view is the Summary (after last hole) */
  showSummary: boolean;
  handlePrevHole: () => void;
  handleNextHole: () => void;
}

export function useHoleNavigation(game: Game | null): UseHoleNavigationReturn {
  const { currentHoleIndex, setCurrentHoleIndex } = useGameContext();

  // Jazz provides reactive updates - no useMemo needed (jazz.xml)
  let holesList: string[] = [];
  if (game?.holes?.$isLoaded) {
    holesList = game.holes
      .map((h) => (h?.$isLoaded ? h.hole : null))
      .filter(Boolean) as string[];
  }

  // Summary is shown when currentHoleIndex equals the number of holes
  // (i.e., one past the last hole index)
  const showSummary = currentHoleIndex === holesList.length;

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

  // Navigation includes Summary as the last "hole" (index = holesList.length)
  // Total positions = holesList.length + 1 (holes + Summary)
  const totalPositions = holesList.length + 1;

  const handlePrevHole = useCallback(() => {
    if (currentHoleIndex === 0) {
      setCurrentHoleIndex(totalPositions - 1);
    } else {
      setCurrentHoleIndex(currentHoleIndex - 1);
    }
  }, [currentHoleIndex, totalPositions, setCurrentHoleIndex]);

  const handleNextHole = useCallback(() => {
    if (currentHoleIndex === totalPositions - 1) {
      setCurrentHoleIndex(0);
    } else {
      setCurrentHoleIndex(currentHoleIndex + 1);
    }
  }, [currentHoleIndex, totalPositions, setCurrentHoleIndex]);

  return {
    currentHoleIndex,
    currentHole,
    currentHoleId,
    currentHoleNumber,
    holeInfo,
    holesList,
    showSummary,
    handlePrevHole,
    handleNextHole,
  };
}
