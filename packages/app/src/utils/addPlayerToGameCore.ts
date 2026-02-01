import type { Account } from "jazz-tools";
import { Group } from "jazz-tools";
import { err, ok, type Result } from "neverthrow";
import { type Game, Handicap, ListOfRounds, Player } from "spicylib/schema";
import { createRoundForPlayer, getRoundsForDate } from "./createRoundForPlayer";
import {
  autoAssignPlayerToTeam,
  computeIsSeamlessMode,
  getNextAvailableTeamNumber,
} from "./gameTeams";
import { reportError } from "./reportError";

export type PlayerData = Parameters<typeof Player.create>[0];

export interface AddPlayerError {
  type:
    | "GAME_NOT_LOADED"
    | "NO_PLAYER_INPUT"
    | "PLAYER_CREATION_FAILED"
    | "PLAYER_NOT_LOADED";
  message: string;
}

export interface AddPlayerOptions {
  /**
   * If true, automatically create a new round for the player if they don't
   * have any rounds for the game date.
   *
   * Note: The core function defaults to false, but useAddPlayerToGame hook
   * defaults to true for better UX.
   */
  autoCreateRound?: boolean;
}

export interface AddPlayerResult {
  player: Player;
  /** True if a round was automatically created for the player */
  roundAutoCreated: boolean;
}

/**
 * Input for adding a player to a game.
 *
 * Prefer passing an existing player reference when available (from catalog,
 * favorites, or me.root.player). Only use playerData when creating a truly
 * new player that doesn't exist in the catalog.
 */
export type AddPlayerInput =
  | { player: Player; playerData?: never }
  | { player?: never; playerData: PlayerData };

/**
 * Core function to add a player to a game.
 * Used by both useAddPlayerToGame hook and useCreateGame.
 *
 * IMPORTANT: When you have an existing player reference (from catalog,
 * favorites, or me.root.player), pass it directly via `input.player`.
 * This ensures the same player CoValue is referenced across all games,
 * keeping rounds accumulated correctly.
 *
 * Only use `input.playerData` when creating a truly new player that
 * doesn't exist in the catalog (e.g., from fresh GHIN search).
 *
 * @param game - The game to add the player to (must be loaded with players and rounds resolved)
 * @param input - Either { player: Player } for existing reference, or { playerData: PlayerData } for new
 * @param workerAccount - Optional worker account to give admin access for sync
 * @param options - Optional configuration for player addition behavior
 */
export async function addPlayerToGameCore(
  game: Game,
  input: AddPlayerInput,
  workerAccount?: Account,
  options: AddPlayerOptions = {},
): Promise<Result<AddPlayerResult, AddPlayerError>> {
  if (!game.$isLoaded || !game.players?.$isLoaded) {
    return err({
      type: "GAME_NOT_LOADED",
      message: "Game or players collection not loaded",
    });
  }

  if (!input.player && !input.playerData) {
    return err({
      type: "NO_PLAYER_INPUT",
      message: "No player reference or data provided",
    });
  }

  const group = game.players.$jazz.owner;

  // Give worker account admin access if provided
  if (workerAccount?.$isLoaded && group instanceof Group) {
    try {
      group.addMember(workerAccount, "admin");
    } catch (e) {
      // "Already a member" is expected and safe to ignore
      // Log unexpected errors for debugging
      const message = e instanceof Error ? e.message : String(e);
      if (!message.includes("already") && !message.includes("member")) {
        reportError(e instanceof Error ? e : new Error(message), {
          source: "addPlayerToGameCore",
          severity: "warning",
          context: { action: "addWorkerToGroup" },
        });
      }
    }
  }

  let player: Player;

  if (input.player) {
    // Use existing player reference directly
    if (!input.player.$isLoaded) {
      return err({
        type: "PLAYER_NOT_LOADED",
        message: "Player reference provided but not loaded",
      });
    }
    player = input.player;
  } else if (input.playerData) {
    // Create new player (only for truly new players not in catalog)
    const playerData = input.playerData;

    // Create handicap if provided
    let handicap: Handicap | undefined;
    if (playerData.handicap) {
      handicap = Handicap.create(
        {
          source: playerData.handicap.source,
          display: playerData.handicap.display,
          value: playerData.handicap.value,
          revDate: playerData.handicap.revDate,
        },
        { owner: group },
      );
    }

    const data = {
      ...playerData,
      handicap,
    };

    try {
      if (playerData.ghinId) {
        // NOTE: upsertUnique is owner-scoped, so this creates a new player
        // in the game's group. This is intentional ONLY when the player
        // doesn't exist in the catalog. Prefer passing input.player when
        // the player exists in the catalog.
        const upsertedPlayer = await Player.upsertUnique({
          value: data,
          unique: playerData.ghinId,
          owner: group,
        });

        if (!upsertedPlayer.$isLoaded) {
          return err({
            type: "PLAYER_CREATION_FAILED",
            message: "Failed to upsert player",
          });
        }

        player = await upsertedPlayer.$jazz.ensureLoaded({
          resolve: { rounds: true, handicap: true },
        });
      } else {
        player = Player.create(data, { owner: group });
      }
    } catch (error) {
      return err({
        type: "PLAYER_CREATION_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Unknown error creating player",
      });
    }
  } else {
    // TypeScript should catch this, but just in case
    return err({
      type: "NO_PLAYER_INPUT",
      message: "No player reference or data provided",
    });
  }

  // Initialize rounds if needed (for players that don't have a rounds list yet)
  if (!player.$jazz.has("rounds")) {
    // Use the player's own group for the rounds list, not the game's group
    const playerGroup = player.$jazz.owner;
    const roundsList = ListOfRounds.create([], { owner: playerGroup });
    player.$jazz.set("rounds", roundsList);
  }

  // Check if player is already in the game
  const existingPlayer = game.players.find(
    (p) => p?.$isLoaded && p.$jazz.id === player.$jazz.id,
  );

  // Only add if not already in the game
  if (!existingPlayer) {
    game.players.$jazz.push(player);
  } else {
    // If player exists but doesn't have rounds, initialize it
    if (existingPlayer.$isLoaded && !existingPlayer.$jazz.has("rounds")) {
      const playerGroup = existingPlayer.$jazz.owner;
      const roundsList = ListOfRounds.create([], { owner: playerGroup });
      existingPlayer.$jazz.set("rounds", roundsList);
    }
  }

  // Return the player from the game context to ensure we have the latest version
  const gamePlayer = game.players.find(
    (p) => p?.$isLoaded && p.$jazz.id === player.$jazz.id,
  );

  const finalPlayer = gamePlayer?.$isLoaded ? gamePlayer : player;

  // Auto-create round if requested and player has no rounds for the game date
  let roundAutoCreated = false;
  if (options.autoCreateRound && game.rounds?.$isLoaded) {
    // Ensure player has rounds loaded for the check
    const playerWithRounds = await finalPlayer.$jazz.ensureLoaded({
      resolve: { rounds: true, handicap: true },
    });

    const roundsForGameDate = getRoundsForDate(playerWithRounds, game.start);

    if (roundsForGameDate.length === 0) {
      const newRound = await createRoundForPlayer(game, playerWithRounds);
      roundAutoCreated = newRound !== null;
    }
  }

  // Auto-assign team in seamless mode (1:1 player to team)
  // This ensures both useCreateGame and useAddPlayerToGame get team assignment
  if (computeIsSeamlessMode(game) && game.rounds?.$isLoaded) {
    // Find the RoundToGame for this player
    const playerId = finalPlayer.$jazz.id;
    let roundToGame = null;

    for (const rtg of game.rounds) {
      if (!rtg?.$isLoaded || !rtg.round?.$isLoaded) continue;
      if (rtg.round.playerId === playerId) {
        roundToGame = rtg;
        break;
      }
    }

    if (roundToGame) {
      // Find next available team number (handles gaps from removed players)
      const teamNumber = getNextAvailableTeamNumber(game);
      // autoAssignPlayerToTeam ensures holes exist internally
      autoAssignPlayerToTeam(game, roundToGame, teamNumber);
    }
  }

  return ok({ player: finalPlayer, roundAutoCreated });
}

// Legacy signature for backwards compatibility during migration
// TODO: Remove after all callers are updated to use AddPlayerInput
export async function addPlayerToGameCoreLegacy(
  game: Game,
  playerData: PlayerData,
  workerAccount?: Account,
  options: AddPlayerOptions = {},
): Promise<Result<AddPlayerResult, AddPlayerError>> {
  return addPlayerToGameCore(game, { playerData }, workerAccount, options);
}
