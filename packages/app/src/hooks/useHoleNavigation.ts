import { useCallback, useMemo, useState } from "react";
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
  currentHoleNumber: string;
  holeInfo: HoleInfo | null;
  holesList: string[];
  handlePrevHole: () => void;
  handleNextHole: () => void;
}

export function useHoleNavigation(game: Game | null): UseHoleNavigationReturn {
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);

  const holesList = useMemo(() => {
    if (!game?.holes?.$isLoaded) return [];
    return game.holes
      .map((h) => (h?.$isLoaded ? h.hole : null))
      .filter(Boolean) as string[];
  }, [game]);

  const currentHole = useMemo(() => {
    if (!game?.holes?.$isLoaded || currentHoleIndex >= game.holes.length) {
      return null;
    }
    const hole = game.holes[currentHoleIndex];
    return hole?.$isLoaded ? hole : null;
  }, [game, currentHoleIndex]);

  const currentHoleNumber = currentHole?.hole || "1";

  // Get hole info from first player's tee
  const holeInfo = useMemo((): HoleInfo | null => {
    if (!game?.rounds?.$isLoaded || game.rounds.length === 0) {
      return null;
    }

    const firstRoundToGame = game.rounds[0];
    if (!firstRoundToGame?.$isLoaded) return null;

    const round = firstRoundToGame.round;
    if (!round?.$isLoaded) return null;

    const tee = round.tee;
    if (!tee?.$isLoaded || !tee.holes?.$isLoaded) return null;

    const hole = tee.holes.find(
      (h) => h?.$isLoaded && h.number?.toString() === currentHoleNumber,
    );

    if (!hole?.$isLoaded) return null;

    return {
      number: currentHoleNumber,
      par: hole.par ?? 4,
      yards: hole.yards ?? 0,
      handicap: hole.handicap ?? 18,
    };
  }, [game, currentHoleNumber]);

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
    currentHoleNumber,
    holeInfo,
    holesList,
    handlePrevHole,
    handleNextHole,
  };
}
