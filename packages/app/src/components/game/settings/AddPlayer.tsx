import { Player } from "spicylib/schema";
import { useGameContext } from "@/contexts/GameContext";

export function AddPlayer() {
  const { game } = useGameContext();

  const _addPlayer = () => {
    if (!game?.players) {
      console.error("GameSettingsPlayers: no players in game");
      return;
    }
    const group = game.players._owner;
    // TODO: do we need this?
    const player = Player.create(
      {
        name: "Brad Anderson",
        email: "brad@spicy.golf",
        short: "boorad",
        level: "",
      },
      { owner: group },
    );
    game?.players?.push(player);
  };

  return null;
}
