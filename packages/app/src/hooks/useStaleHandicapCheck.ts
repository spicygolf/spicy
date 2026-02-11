import type { MaybeLoaded } from "jazz-tools";
import { useCallback, useMemo, useState } from "react";
import type { ListOfPlayers } from "spicylib/schema";

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface StalePlayer {
  playerId: string;
  playerName: string;
  ghinId: string;
  currentDisplay: string | undefined;
  revDate: Date | undefined;
}

interface UseStaleHandicapCheckResult {
  stalePlayers: StalePlayer[];
  dismissPlayer: (playerId: string) => void;
  dismissAll: () => void;
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
 * Dismissed players are tracked in session-scoped state so they are not
 * flagged again until the app is restarted.
 */
export function useStaleHandicapCheck(
  players: MaybeLoaded<ListOfPlayers> | null | undefined,
): UseStaleHandicapCheckResult {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(
    () => new Set(),
  );

  const stalePlayers = useMemo((): StalePlayer[] => {
    if (!players?.$isLoaded) return [];

    const stale: StalePlayer[] = [];

    for (const player of players) {
      if (!player?.$isLoaded) continue;
      if (!player.handicap?.$isLoaded) continue;

      // Only check GHIN-sourced handicaps
      if (player.handicap.source !== "ghin") continue;

      // Must have a ghinId to be refreshable
      const ghinId = player.ghinId;
      if (!ghinId) continue;

      const playerId = player.$jazz.id;

      // Skip dismissed players
      if (dismissedIds.has(playerId)) continue;

      const revDate = player.handicap.revDate
        ? new Date(player.handicap.revDate)
        : undefined;

      const isStale =
        !revDate || Date.now() - revDate.getTime() > STALE_THRESHOLD_MS;

      if (isStale) {
        stale.push({
          playerId,
          playerName: player.name,
          ghinId,
          currentDisplay: player.handicap.display,
          revDate,
        });
      }
    }

    return stale;
  }, [players, dismissedIds]);

  const dismissPlayer = useCallback((playerId: string): void => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(playerId);
      return next;
    });
  }, []);

  const dismissAll = useCallback((): void => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      for (const sp of stalePlayers) {
        next.add(sp.playerId);
      }
      return next;
    });
  }, [stalePlayers]);

  return { stalePlayers, dismissPlayer, dismissAll };
}
