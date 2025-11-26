import { useCallback, useEffect, useState } from "react";
import type { Game, GameHole } from "spicylib/schema";

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

  // PERFORMANCE: Track first render only
  useEffect(() => {
    console.log("[PERF] useHoleNavigation MOUNTED");
  }, []); // Run only once on mount

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

  // Get hole info from first player's tee - direct Jazz access
  let holeInfo: HoleInfo | null = null;
  if (game?.rounds?.$isLoaded && game.rounds.length > 0) {
    const firstRoundToGame = game.rounds[0];
    if (firstRoundToGame?.$isLoaded) {
      const round = firstRoundToGame.round;
      if (round?.$isLoaded) {
        const tee = round.tee;
        if (tee?.$isLoaded && tee.holes?.$isLoaded) {
          const hole = tee.holes.find(
            (h) => h?.$isLoaded && h.number?.toString() === currentHoleNumber,
          );

          if (hole?.$isLoaded) {
            holeInfo = {
              number: currentHoleNumber,
              par: hole.par ?? 4,
              yards: hole.yards ?? 0,
              handicap: hole.handicap ?? 18,
            };
          }
        }
      }
    }
  }

  // PERFORMANCE: Track when hole index changes (log once per hole navigation)
  useEffect(() => {
    console.log("[PERF] useHoleNavigation hole changed", {
      currentHoleIndex,
    });
    // Only log when currentHoleIndex changes
  }, [currentHoleIndex]);

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
