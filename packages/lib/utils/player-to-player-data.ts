import type { Player } from "spicylib/schema";
import type { PlayerData } from "./add-player-to-game-core";

/**
 * Converts a loaded Player CoMap to PlayerData format for use with addPlayerToGame.
 * Requires the player to be loaded with handicap resolved.
 */
export function playerToPlayerData(player: Player): PlayerData {
  return {
    name: player.name,
    short: player.short,
    gender: player.gender,
    ghinId: player.ghinId,
    handicap: player.handicap?.$isLoaded
      ? {
          source: player.handicap.source,
          display: player.handicap.display,
          value: player.handicap.value,
          revDate: player.handicap.revDate,
        }
      : undefined,
  };
}
