import { useEffect, useRef } from "react";
import type { Game } from "spicylib/schema";
import { ensureGameHoles } from "@/utils/gameTeams";

/**
 * One-time initialization hook for game data
 * Ensures game holes exist when game is first loaded
 */
export function useGameInitialization(game: Game | null) {
  const initialized = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: game causes infinite loops due to Jazz reactivity
  useEffect(() => {
    if (!game?.$isLoaded || !game.holes?.$isLoaded || initialized.current) {
      return;
    }

    // Initialize game holes if they don't exist (idempotent)
    ensureGameHoles(game);
    initialized.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.$jazz.id]); // Only depend on game ID, not the reactive game object
}
