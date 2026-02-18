import type { MaybeLoaded } from "jazz-tools";
import { useMemo } from "react";
import type { ListOfPlayers } from "spicylib/schema";

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface StalePlayer {
  playerId: string;
  playerName: string;
  ghinId: string;
  currentDisplay: string | undefined;
  revDate: Date | undefined;
}

/**
 * Checks if any players in a game have stale (outdated) handicap data.
 *
 * A handicap is considered stale if:
 * - revDate is missing, OR
 * - revDate is more than 24 hours old
 *
 * Only players with `handicap.source === "ghin"` and a `ghinId` are checked,
 * since manual handicaps are never stale and ghinId is needed for refresh.
 *
 * The check is suppressed when `dismissedAt` is set and no player's revDate
 * is newer than the dismiss timestamp (meaning no fresh data has arrived
 * since the user last dismissed).
 */
export function useStaleHandicapCheck(
  players: MaybeLoaded<ListOfPlayers> | null | undefined,
  dismissedAt: Date | undefined,
): StalePlayer[] {
  return useMemo((): StalePlayer[] => {
    if (!players?.$isLoaded) return [];

    const stale: StalePlayer[] = [];

    for (const player of players) {
      if (!player?.$isLoaded) continue;
      if (!player.$jazz.has("handicap") || !player.handicap?.$isLoaded)
        continue;

      // Only check GHIN-sourced handicaps
      if (player.handicap.source !== "ghin") continue;

      // Must have a ghinId to be refreshable
      if (!player.$jazz.has("ghinId")) continue;
      const ghinId = player.ghinId;
      if (!ghinId) continue;

      const revDate = player.handicap.revDate
        ? new Date(player.handicap.revDate)
        : undefined;

      const isStale =
        !revDate || Date.now() - revDate.getTime() > STALE_THRESHOLD_MS;

      if (isStale) {
        stale.push({
          playerId: player.$jazz.id,
          playerName: player.name,
          ghinId,
          currentDisplay: player.handicap.display,
          revDate,
        });
      }
    }

    // If user already dismissed and no handicap data has been refreshed since,
    // suppress the stale list so the modal doesn't reappear.
    if (dismissedAt && stale.length > 0) {
      const anyNewerThanDismiss = stale.some(
        (sp) => sp.revDate && sp.revDate.getTime() > dismissedAt.getTime(),
      );
      if (!anyNewerThanDismiss) return [];
    }

    return stale;
  }, [players, dismissedAt]);
}
