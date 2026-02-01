import { err, type Result } from "neverthrow";
import type { Player } from "spicylib/schema";
import {
  type AddPlayerError,
  type AddPlayerInput,
  type AddPlayerOptions,
  type AddPlayerResult,
  addPlayerToGameCore,
  type PlayerData,
} from "../utils/addPlayerToGameCore";
import { useGame } from "./useGame";
import { useJazzWorker } from "./useJazzWorker";

// Re-export types for consumers
export type {
  AddPlayerError,
  AddPlayerInput,
  AddPlayerOptions,
  AddPlayerResult,
  PlayerData,
} from "../utils/addPlayerToGameCore";

/**
 * Type guard to check if the input is a Player CoValue reference.
 * Players have $jazz and $isLoaded properties from Jazz.
 */
function isPlayer(input: Player | PlayerData): input is Player {
  return (
    input !== null &&
    typeof input === "object" &&
    "$jazz" in input &&
    "$isLoaded" in input
  );
}

export interface UseAddPlayerError {
  type: AddPlayerError["type"] | "NO_WORKER_ACCOUNT";
  message: string;
}

/**
 * Hook to add a player to the current game.
 *
 * Returns a function that accepts either:
 * - A Player reference (from catalog, favorites, or me.root.player) - PREFERRED
 * - PlayerData to create a new player - only for truly new players
 *
 * In seamless mode (players <= min_players and spec doesn't force teams),
 * the player is automatically assigned to their own team (1:1 assignment).
 * This happens in addPlayerToGameCore().
 *
 * @example
 * // Using existing player reference (preferred)
 * const catalogPlayer = findByGhinId("1234567");
 * if (catalogPlayer) {
 *   await addPlayerToGame(catalogPlayer);
 * }
 *
 * @example
 * // Using player data (only for new players not in catalog)
 * await addPlayerToGame({
 *   name: "John Doe",
 *   short: "John",
 *   gender: "M",
 *   ghinId: "1234567",
 * });
 */
export function useAddPlayerToGame() {
  const { game } = useGame(undefined, {
    resolve: {
      scope: { teamsConfig: true },
      spec: { $each: { $each: true } }, // Working copy of options (MapOfOptions -> Option fields)
      players: {
        $each: {
          name: true,
          handicap: true,
          rounds: true,
        },
      },
      rounds: {
        $each: true,
      },
      holes: { $each: { teams: { $each: { rounds: true } } } },
    },
  });
  const worker = useJazzWorker();

  /**
   * Add a player to the current game.
   *
   * @param playerOrData - Either a Player reference or PlayerData object
   * @param options - Configuration options (autoCreateRound defaults to true)
   */
  const addPlayerToGame = async (
    playerOrData: Player | PlayerData,
    options: AddPlayerOptions = { autoCreateRound: true },
  ): Promise<Result<AddPlayerResult, UseAddPlayerError>> => {
    if (!game?.$isLoaded || !game.players?.$isLoaded) {
      return err({
        type: "GAME_NOT_LOADED",
        message: "Game or players collection not loaded",
      });
    }

    if (!worker?.account?.$isLoaded) {
      return err({
        type: "NO_WORKER_ACCOUNT",
        message: "Worker account not loaded",
      });
    }

    // Determine if input is a Player reference or PlayerData
    const input: AddPlayerInput = isPlayer(playerOrData)
      ? { player: playerOrData }
      : { playerData: playerOrData };

    // Add the player to the game
    // Note: addPlayerToGameCore handles auto-team-assignment in seamless mode
    const result = await addPlayerToGameCore(
      game,
      input,
      worker.account,
      options,
    );

    return result;
  };

  return addPlayerToGame;
}
