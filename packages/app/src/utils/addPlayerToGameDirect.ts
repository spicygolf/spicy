import { type Game, Handicap, ListOfRounds, Player } from "spicylib/schema";
import type { PlayerData } from "../hooks/useAddPlayerToGame";

/**
 * Adds a player to a game directly without requiring React context.
 * Used when creating a new game and adding the current player immediately.
 */
export async function addPlayerToGameDirect(
  game: Game,
  playerData: PlayerData,
): Promise<Player | null> {
  if (!game.$isLoaded || !game.players?.$isLoaded) {
    return null;
  }

  const group = game.players.$jazz.owner;

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

  if (playerData.ghinId) {
    const upsertedPlayer = await Player.upsertUnique({
      value: data,
      unique: playerData.ghinId,
      owner: group,
    });

    if (!upsertedPlayer.$isLoaded) {
      return null;
    }

    player = await upsertedPlayer.$jazz.ensureLoaded({
      resolve: { rounds: true, handicap: true },
    });
  } else {
    player = Player.create(data, { owner: group });
  }

  // Initialize rounds if needed
  if (!player.$jazz.has("rounds")) {
    const roundsList = ListOfRounds.create([], { owner: group });
    player.$jazz.set("rounds", roundsList);
  }

  // Add to game if not already present
  const existingPlayer = game.players.find(
    (p) => p?.$isLoaded && p.$jazz.id === player.$jazz.id,
  );

  if (!existingPlayer) {
    game.players.$jazz.push(player);
  }

  return player;
}
