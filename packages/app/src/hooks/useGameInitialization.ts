import { useEffect, useRef } from "react";
import type { Game } from "spicylib/schema";
import { ensureGameHoles, ensureSeamlessTeamAssignments } from "spicylib/utils";

/**
 * One-time initialization hook for game data
 * Ensures game holes exist and seamless teams are assigned when game is first loaded
 */
export function useGameInitialization(game: Game | null) {
  const initialized = useRef(false);

  useEffect(() => {
    if (
      !game?.$isLoaded ||
      !game.holes?.$isLoaded ||
      !game.rounds?.$isLoaded ||
      initialized.current
    ) {
      return;
    }

    // Initialize game holes if they don't exist (idempotent)
    ensureGameHoles(game);

    // Defense-in-depth: ensure seamless team assignments exist (idempotent)
    // This handles legacy games or edge cases where team assignment was missed
    ensureSeamlessTeamAssignments(game);

    initialized.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.$jazz.id]); // Only depend on game ID, not the reactive game object
}
