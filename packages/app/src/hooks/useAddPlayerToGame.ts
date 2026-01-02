import { err, type Result } from "neverthrow";
import type { Game, Player } from "spicylib/schema";
import {
  type AddPlayerError,
  type AddPlayerInput,
  type AddPlayerOptions,
  type AddPlayerResult,
  addPlayerToGameCore,
  type PlayerData,
} from "../utils/addPlayerToGameCore";
import { autoAssignPlayerToTeam } from "../utils/gameTeams";
import { useGame } from "./useGame";
import { useJazzWorker } from "./useJazzWorker";
import { computeSpecForcesTeams } from "./useTeamsMode";

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
 * automatically assigns the player to their own team (1:1 assignment).
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
      specs: { $each: { teamsConfig: true } },
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
    const result = await addPlayerToGameCore(
      game,
      input,
      worker.account,
      options,
    );

    if (result.isErr()) {
      return result;
    }

    // Check if we should auto-assign team (seamless mode)
    const shouldAutoAssign = computeShouldAutoAssignTeam(game);

    if (shouldAutoAssign && game.rounds?.$isLoaded) {
      // Find the RoundToGame for this player
      const playerId = result.value.player.$jazz.id;
      let roundToGame = null;

      for (const rtg of game.rounds) {
        if (!rtg?.$isLoaded || !rtg.round?.$isLoaded) continue;
        if (rtg.round.playerId === playerId) {
          roundToGame = rtg;
          break;
        }
      }

      if (roundToGame) {
        // Assign to team number = current player count (after adding)
        const teamNumber = game.players.length;
        autoAssignPlayerToTeam(game, roundToGame, teamNumber);
      }
    }

    return result;
  };

  return addPlayerToGame;
}

/**
 * Determines if a new player should be auto-assigned to a team.
 *
 * Auto-assign when:
 * - Spec doesn't force teams mode (not rotating, not true team game)
 * - User hasn't manually activated teams mode
 * - Player count will be <= min_players after adding
 *
 * Note: This is computed BEFORE adding the player, so we check
 * if current players < min_players (will be <= after adding).
 */
function computeShouldAutoAssignTeam(game: Game): boolean {
  if (!game.$isLoaded) return false;

  // Get specs from game
  const specs = [];
  if (game.specs?.$isLoaded) {
    for (const spec of game.specs) {
      if (spec?.$isLoaded) specs.push(spec);
    }
  }

  if (specs.length === 0) return false;

  // Check if any spec forces teams mode
  const specForcesTeams = specs.some(computeSpecForcesTeams);
  if (specForcesTeams) return false;

  // Check if user has manually activated teams mode
  const userActivated =
    game.scope?.$isLoaded &&
    game.scope.teamsConfig?.$isLoaded &&
    game.scope.teamsConfig.active === true;
  if (userActivated) return false;

  // Get min_players from specs
  const minPlayers = Math.min(...specs.map((s) => s.min_players));

  // Current player count (before adding)
  const currentPlayerCount = game.players?.$isLoaded ? game.players.length : 0;

  // Auto-assign if adding this player keeps us at or below min_players
  // We check < because we're about to add one more
  return currentPlayerCount < minPlayers;
}
