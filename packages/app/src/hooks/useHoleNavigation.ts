import { useCallback, useRef } from "react";
import type { Game, GameHole } from "spicylib/schema";
import {
  DEFAULT_HANDICAP_ALLOCATION,
  DEFAULT_PAR,
  DEFAULT_YARDS,
} from "@/constants/golf";
import { useGameIdContext } from "@/contexts/GameContext";

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
  const { currentHoleIndex, setCurrentHoleIndex } = useGameIdContext();

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

  // Use ref so callbacks always read the current value at call time,
  // not a stale closure value captured during Jazz reconnection.
  // During reconnection, totalPositions transiently becomes 1 (empty holesList),
  // and useCallback would close over that broken value.
  const totalPositionsRef = useRef(totalPositions);
  totalPositionsRef.current = totalPositions;

  const handlePrevHole = useCallback(() => {
    const tp = totalPositionsRef.current;
    if (tp <= 1) {
      console.warn("[scoring_nav_blocked] prevHole: data not loaded");
      return;
    }
    setCurrentHoleIndex((prev) => (prev === 0 ? tp - 1 : prev - 1));
  }, [setCurrentHoleIndex]);

  const handleNextHole = useCallback(() => {
    const tp = totalPositionsRef.current;
    if (tp <= 1) {
      console.warn("[scoring_nav_blocked] nextHole: data not loaded");
      return;
    }
    setCurrentHoleIndex((prev) => (prev === tp - 1 ? 0 : prev + 1));
  }, [setCurrentHoleIndex]);

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
