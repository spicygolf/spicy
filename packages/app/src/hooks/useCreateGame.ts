import { Group } from "jazz-tools";
import { useAccount } from "jazz-tools/react-native";
import type { GameSpec } from "spicylib/schema";
import {
  Game,
  ListOfGameHoles,
  ListOfGameSpecs,
  ListOfPlayers,
  ListOfRoundToGames,
  PlayerAccount,
} from "spicylib/schema";

export function useCreateGame() {
  const me = useAccount(PlayerAccount, {
    select: (me) =>
      me.$isLoaded
        ? me
        : me.$jazz.loadingState === "loading"
          ? undefined
          : null,
  });

  const createGame = async (name: string, specs: GameSpec[]) => {
    if (!me?.$isLoaded || !me.root?.$isLoaded) return null;

    const group = Group.create();
    group.addMember(me, "admin");

    // Create game specs list
    const gameSpecs = ListOfGameSpecs.create(specs, { owner: group });

    // Create players list
    const players = ListOfPlayers.create([], { owner: group });

    // Create game holes list (empty for now)
    const holes = ListOfGameHoles.create([], { owner: group });

    // Create round to games list (empty for now)
    const roundToGames = ListOfRoundToGames.create([], { owner: group });

    // Create the game
    const game = Game.create(
      {
        start: new Date(),
        name,
        specs: gameSpecs,
        holes,
        players,
        rounds: roundToGames,
      },
      { owner: group },
    );

    // Add game to user's games list
    if (me.root.games?.$isLoaded) {
      me.root.games.$jazz.push(game);
    }

    return game;
  };

  return { createGame };
}
