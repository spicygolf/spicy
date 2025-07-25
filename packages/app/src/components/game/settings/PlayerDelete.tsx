import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { TouchableOpacity } from "react-native";
import { useGameContext } from "@/contexts/GameContext";
import type { Player } from "@/schema/players";

export function PlayerDelete({ player }: { player: Player }) {
  const { game } = useGameContext();

  const deletePlayer = () => {
    // TODO: detect whether there are other things in the game linked to this
    //       player, and if so, show a dialog to the user, confirming delete.
    //       In this case, we also need to clean out the scores/teams, etc. that
    //       reference this player.
    //       For now, we just delete the player.
    const idx = game?.players?.findIndex((p) => p?.id === player.id);
    if (idx !== undefined) {
      game?.players?.splice(idx, 1);
    }
  };

  return (
    <TouchableOpacity onPress={() => deletePlayer()}>
      <FontAwesome6
        name="delete-left"
        size={18}
        color="#666"
        iconStyle="solid"
      />
    </TouchableOpacity>
  );
}
