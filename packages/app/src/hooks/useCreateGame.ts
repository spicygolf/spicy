import { Group } from "jazz-tools";
import { useAccount } from "jazz-tools/react-core";
import type { GameSpec } from "spicylib/schema";
import {
  Game,
  ListOfGameHoles,
  ListOfGameSpecs,
  ListOfPlayers,
  ListOfRoundToGames,
  PlayerAccount,
} from "spicylib/schema";
import { useJazzWorker } from "./useJazzWorker";

export function useCreateGame() {
  const { me } = useAccount(PlayerAccount, {
    resolve: {
      root: {
        player: true,
        games: true,
      },
    },
  });
  const worker = useJazzWorker();

  return (spec: GameSpec): Game | undefined => {
    if (!me || !me.root) {
      console.error("useCreateGame: user account not loaded");
      return;
    }
    if (!worker?.account) {
      console.error("useCreateGame: worker account not loaded");
      return;
    }
    // create a group for the game
    const group = Group.create({ owner: me });
    group.addMember(worker.account, "admin");

    const specs = ListOfGameSpecs.create([], { owner: group });
    specs.push(spec);
    const holes = ListOfGameHoles.create([], { owner: group });
    const players = ListOfPlayers.create([], { owner: group });
    const player = me.root?.player;

    if (!player) {
      console.warn("useCreateGame: no player in PlayerAccount");
    } else {
      players.push(player);
    }

    const rounds = ListOfRoundToGames.create([], { owner: group });

    const game = Game.create(
      {
        start: new Date(),
        name: spec.name,
        specs,
        holes,
        players,
        rounds,
      },
      { owner: group },
    );

    me.root.games?.push(game);
    return game;
  };
}
