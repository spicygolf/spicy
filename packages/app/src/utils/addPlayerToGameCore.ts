import type { Account } from "jazz-tools";
import { Group } from "jazz-tools";
import { err, ok, type Result } from "neverthrow";
import { type Game, Handicap, ListOfRounds, Player } from "spicylib/schema";

export type PlayerData = Parameters<typeof Player.create>[0];

export interface AddPlayerError {
  type: "GAME_NOT_LOADED" | "NO_PLAYER_DATA" | "PLAYER_CREATION_FAILED";
  message: string;
}

/**
 * Core function to add a player to a game.
 * Used by both useAddPlayerToGame hook and useCreateGame.
 *
 * @param game - The game to add the player to (must be loaded with players resolved)
 * @param playerData - The player data to create/upsert
 * @param workerAccount - Optional worker account to give admin access for sync
 */
export async function addPlayerToGameCore(
  game: Game,
  playerData: PlayerData,
  workerAccount?: Account,
): Promise<Result<Player, AddPlayerError>> {
  if (!game.$isLoaded || !game.players?.$isLoaded) {
    return err({
      type: "GAME_NOT_LOADED",
      message: "Game or players collection not loaded",
    });
  }

  if (!playerData) {
    return err({
      type: "NO_PLAYER_DATA",
      message: "No player data provided",
    });
  }

  const group = game.players.$jazz.owner;

  // Give worker account admin access if provided
  if (workerAccount?.$isLoaded && group instanceof Group) {
    try {
      group.addMember(workerAccount, "admin");
    } catch (_e) {
      // Ignore - might already be a member
    }
  }

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

  let player: Player;

  try {
    if (playerData.ghinId) {
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

  // Initialize rounds if needed
  if (!player.$jazz.has("rounds")) {
    const roundsList = ListOfRounds.create([], { owner: group });
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
      const roundsList = ListOfRounds.create([], { owner: group });
      existingPlayer.$jazz.set("rounds", roundsList);
    }
  }

  // Return the player from the game context to ensure we have the latest version
  const gamePlayer = game.players.find(
    (p) => p?.$isLoaded && p.$jazz.id === player.$jazz.id,
  );

  return ok(gamePlayer?.$isLoaded ? gamePlayer : player);
}
