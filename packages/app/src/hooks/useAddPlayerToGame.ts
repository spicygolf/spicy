import { Group } from "jazz-tools";
import { Player } from "spicylib/schema";
import { useGameContext } from "@/contexts/GameContext";
import { useJazzWorker } from "./useJazzWorker";

export type PlayerData = Parameters<typeof Player.create>[0];

export function useAddPlayerToGame() {
  const { game } = useGameContext();
  const worker = useJazzWorker();

  const addPlayerToGame = async (p: PlayerData) => {
    if (!game?.players) {
      console.error("useAddPlayerToGame: no players in game");
      return;
    }
    if (!p) {
      console.error("useAddPlayerToGame: no player");
      return;
    }
    if (!worker?.account) {
      console.error("useAddPlayerToGame: worker account not loaded");
      return;
    }
    const group = game.players._owner;
    // Give the worker account admin access to this player's group
    if (group instanceof Group) {
      try {
        group.addMember(worker.account, "admin");
      } catch (_e) {}
    }

    // Convert null handicap to undefined to match schema expectations
    const playerData = {
      ...p,
      handicap: p.handicap === null ? undefined : p.handicap,
      envs: p.envs === null ? undefined : p.envs,
    };

    let player: Player | null = null;
    if (playerData.ghinId) {
      player = await Player.upsertUnique({
        value: playerData,
        unique: playerData.ghinId,
        owner: group,
      });
    } else {
      player = Player.create(playerData, { owner: group });
    }

    if (!player) {
      console.error("useAddPlayerToGame: failed to create or upsert player");
      return;
    }

    game?.players?.push(player);
    console.log("player added to game", player);
  };

  return addPlayerToGame;
}
