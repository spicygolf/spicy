import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { TouchableOpacity } from "react-native";
import type { Player } from "spicylib/schema";
import { useGameContext } from "@/contexts/GameContext";

export function PlayerDelete({ player }: { player: Player }) {
  const { game } = useGameContext();

  const deletePlayer = () => {
    // TODO: detect whether there are other things in the game linked to this
    //       player, and if so, show a dialog to the user, confirming delete.
    //       In this case, we also need to clean out the scores/teams, etc. that
    //       reference this player.
    if (!game?.players?.$isLoaded || !game?.rounds?.$isLoaded) return;
    if (!player?.rounds?.$isLoaded) return;

    // Get all round IDs for this player
    const playerRoundIds = new Set(
      player.rounds.filter((r) => r?.$isLoaded).map((r) => r.$jazz.id),
    );

    // Remove RoundToGame entries that reference this player's rounds
    const roundsToKeep = game.rounds.filter((rtg) => {
      if (!rtg?.$isLoaded || !rtg.round?.$isLoaded) return true;
      return !playerRoundIds.has(rtg.round.$jazz.id);
    });

    // Clear and repopulate the rounds list
    game.rounds.$jazz.splice(0, game.rounds.length, ...roundsToKeep);

    // Remove the player
    const idx = game.players.findIndex((p) => p?.$jazz?.id === player.$jazz.id);
    if (idx !== undefined && idx !== -1) {
      game.players.$jazz.splice(idx, 1);
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
