import type { CoMapInit } from "jazz-tools";
import { Player } from "spicylib/schema";
import { useGameContext } from "@/contexts/GameContext";

export function useAddPlayerToGame() {
  const { game } = useGameContext();

  const addPlayerToGame = (p: CoMapInit<Player>) => {
    if (!game?.players) {
      console.error("useAddPlayerToGame: no players in game");
      return;
    }
    if (!p) {
      console.error("useAddPlayerToGame: no player");
      return;
    }
    const group = game.players._owner;
    // Convert null handicap to undefined to match schema expectations
    const playerData = {
      ...p,
      handicap: p.handicap === null ? undefined : p.handicap,
      envs: p.envs === null ? undefined : p.envs,
    };
    const player = Player.create(playerData, { owner: group });
    game?.players?.push(player);
  };

  return addPlayerToGame;
}
