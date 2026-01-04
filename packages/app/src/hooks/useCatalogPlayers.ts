import type { Player } from "spicylib/schema";
import { useJazzWorker } from "./useJazzWorker";

/**
 * Hook to access the catalog of players from the worker account.
 *
 * The catalog contains all players imported from GHIN/ArangoDB,
 * keyed by GHIN ID or `manual_{legacyId}` for manual players.
 *
 * Use this to look up existing players before creating new ones.
 */
export function useCatalogPlayers() {
  const { account: workerAccount } = useJazzWorker({
    profile: {
      catalog: {
        players: { $each: { handicap: true, clubs: { $each: true } } },
      },
    },
  });

  const isLoading =
    !workerAccount?.$isLoaded ||
    !workerAccount.profile?.$isLoaded ||
    !workerAccount.profile.catalog?.$isLoaded;

  const playersMap = (() => {
    if (isLoading) return null;
    const catalog = workerAccount.profile.catalog;
    // Use $jazz.has() to check if property exists before accessing
    if (!catalog.$jazz.has("players")) return null;
    if (!catalog.players?.$isLoaded) return null;
    return catalog.players;
  })();

  /**
   * Find a player in the catalog by GHIN ID.
   * Returns the player reference if found, null otherwise.
   */
  const findByGhinId = (ghinId: string): Player | null => {
    if (!playersMap) return null;
    const player = playersMap[ghinId];
    return player?.$isLoaded ? player : null;
  };

  /**
   * Find a player in the catalog by legacy ID (for manual players).
   * Returns the player reference if found, null otherwise.
   */
  const findByLegacyId = (legacyId: string): Player | null => {
    if (!playersMap) return null;
    const key = `manual_${legacyId}`;
    const player = playersMap[key];
    return player?.$isLoaded ? player : null;
  };

  /**
   * Find a player by either GHIN ID or legacy ID.
   * Tries GHIN ID first, then falls back to legacy ID.
   */
  const findPlayer = (ghinId?: string, legacyId?: string): Player | null => {
    if (ghinId) {
      const player = findByGhinId(ghinId);
      if (player) return player;
    }
    if (legacyId) {
      return findByLegacyId(legacyId);
    }
    return null;
  };

  /**
   * Search for players by name (case-insensitive partial match).
   * Returns array of matching players.
   */
  const searchByName = (query: string, limit = 20): Player[] => {
    if (!playersMap || !query.trim()) return [];

    const lowerQuery = query.toLowerCase().trim();
    const results: Player[] = [];

    for (const key in playersMap) {
      if (results.length >= limit) break;

      const player = playersMap[key];
      if (
        player?.$isLoaded &&
        player.name?.toLowerCase().includes(lowerQuery)
      ) {
        results.push(player);
      }
    }

    return results;
  };

  /**
   * Get all players as an array.
   */
  const allPlayers = (): Player[] => {
    if (!playersMap) return [];
    return Object.values(playersMap).filter(
      (player): player is Player => player?.$isLoaded === true,
    );
  };

  return {
    isLoading,
    playersMap,
    findByGhinId,
    findByLegacyId,
    findPlayer,
    searchByName,
    allPlayers,
  };
}
