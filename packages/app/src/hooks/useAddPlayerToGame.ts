import { Group } from "jazz-tools";
import { err, ok, type Result } from "neverthrow";
import { ListOfRounds, Player } from "spicylib/schema";
import { useGameContext } from "@/contexts/GameContext";
import { useJazzWorker } from "./useJazzWorker";

export type PlayerData = Parameters<typeof Player.create>[0];

export interface AddPlayerError {
  type:
    | "NO_PLAYERS"
    | "NO_PLAYER_DATA"
    | "NO_WORKER_ACCOUNT"
    | "PLAYER_CREATION_FAILED";
  message: string;
}

export function useAddPlayerToGame() {
  const { game } = useGameContext();
  const worker = useJazzWorker();

  const addPlayerToGame = async (
    p: PlayerData,
  ): Promise<Result<Player, AddPlayerError>> => {
    if (!game?.players) {
      return err({
        type: "NO_PLAYERS",
        message: "No players collection in game",
      });
    }

    if (!p) {
      return err({
        type: "NO_PLAYER_DATA",
        message: "No player data provided",
      });
    }

    if (!worker?.account) {
      return err({
        type: "NO_WORKER_ACCOUNT",
        message: "Worker account not loaded",
      });
    }

    const group = game.players.$jazz.owner;

    // Give the worker account admin access to this player's group
    if (group instanceof Group) {
      try {
        group.addMember(worker.account, "admin");
      } catch (_e) {
        // Ignore errors when adding member - might already be a member
      }
    }

    // Convert null handicap to undefined to match schema expectations
    const playerData = {
      ...p,
      handicap: p.handicap === null ? undefined : p.handicap,
      envs: p.envs === null ? undefined : p.envs,
    };

    let player: Player | null = null;

    try {
      if (playerData.ghinId) {
        // Load the player with rounds resolved to check if it already has a rounds field
        const upsertedPlayer = await Player.upsertUnique({
          value: playerData,
          unique: playerData.ghinId,
          owner: group,
        });

        if (!upsertedPlayer) {
          throw new Error("Failed to upsert player");
        }

        // Ensure the player is loaded with rounds to check if rounds field exists
        player = await upsertedPlayer.$jazz.ensureLoaded({
          resolve: { rounds: true },
        });
      } else {
        player = Player.create(playerData, { owner: group });
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

    if (!player) {
      return err({
        type: "PLAYER_CREATION_FAILED",
        message: "Failed to create or upsert player",
      });
    }

    // Initialize rounds field if it doesn't exist
    // Use $jazz.has to check if the field actually exists vs just not loaded
    if (!player.$jazz.has("rounds")) {
      const roundsList = ListOfRounds.create([], { owner: group });
      player.$jazz.set("rounds", roundsList);
    }

    // Check if player is already in the game
    const existingPlayer = game.players.find(
      (p) => p?.$jazz.id === player.$jazz.id,
    );

    // Only add if not already in the game
    if (!existingPlayer) {
      game.players.$jazz.push(player);
    } else {
      // If player exists but doesn't have rounds, initialize it
      if (!existingPlayer.$jazz.has("rounds")) {
        const roundsList = ListOfRounds.create([], { owner: group });
        existingPlayer.$jazz.set("rounds", roundsList);
      }
    }

    // Return the player from the game context to ensure we have the latest version
    const gamePlayer = game.players.find(
      (p) => p?.$jazz.id === player.$jazz.id,
    );

    return ok(gamePlayer || player);
  };

  return addPlayerToGame;
}
