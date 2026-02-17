import { useEffect, useRef } from "react";
import type { Game } from "spicylib/schema";
import { ensureHoleHasTeams } from "@/utils/gameTeams";

/**
 * Per-hole initialization hook
 * Ensures each hole has teams when first navigated to
 */
export function useHoleInitialization(
  game: Game | null,
  currentHoleIndex: number,
  rotateEvery: number | undefined,
) {
  const initializedHoles = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (
      !game?.$isLoaded ||
      !game.holes?.$isLoaded ||
      rotateEvery === undefined ||
      initializedHoles.current.has(currentHoleIndex)
    ) {
      return;
    }

    // Initialize this hole's teams (copies from hole 1 if rotateEvery=0)
    ensureHoleHasTeams(game, game.holes, currentHoleIndex, rotateEvery);
    initializedHoles.current.add(currentHoleIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.$jazz.id, currentHoleIndex, rotateEvery]);
}
