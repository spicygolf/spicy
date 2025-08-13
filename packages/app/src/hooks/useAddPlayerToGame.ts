import { Player } from "spicylib/schema";
import { useGameContext } from "@/contexts/GameContext";
import { useJazzWorker } from "./useJazzWorker";

export type PlayerData = Parameters<typeof Player.create>[0];

export function useAddPlayerToGame() {
  const { game } = useGameContext();
  const { id } = useJazzWorker();

  const addPlayerToGame = async (p: PlayerData) => {
    if (!game?.players) {
      console.error("useAddPlayerToGame: no players in game");
      return;
    }
    if (!p) {
      console.error("useAddPlayerToGame: no player");
      return;
    }
    const group = game.players._owner;
    // Give the worker account admin access to this player's group
    if (id && "addMember" in group) {
      try {
        group.addMember(id, "admin");
      } catch (_e) {}
    }

    // Convert null handicap to undefined to match schema expectations
    const playerData = {
      ...p,
      handicap: p.handicap === null ? undefined : p.handicap,
      envs: p.envs === null ? undefined : p.envs,
    };

    const player = await Player.upsertUnique({
      value: playerData,
      unique: {
        handicap: {
          source: "ghin",
          identifier: playerData.handicap?.identifier,
        },
      },
      owner: group,
    });

    game?.players?.push(player);
    console.log("player added to game", player);
  };

  return addPlayerToGame;
}
