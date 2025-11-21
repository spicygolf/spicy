import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { TouchableOpacity } from "react-native";
import type { Player } from "spicylib/schema";
import { useGameContext } from "@/contexts/GameContext";

export function PlayerDelete({ player }: { player: Player }) {
  const { game } = useGameContext();

  const deletePlayer = () => {
    // TODO: detect whether there are other things in the game linked to this
    //       player, and if so, show a dialog to the user, confirming delete.
    if (!game?.players?.$isLoaded || !game?.rounds?.$isLoaded) return;
    if (!player?.rounds?.$isLoaded) return;

    // Get all round IDs for this player
    const playerRoundIds = new Set(
      player.rounds.filter((r) => r?.$isLoaded).map((r) => r.$jazz.id),
    );

    // Get all RoundToGame IDs that reference this player's rounds
    const roundToGameIds = new Set(
      game.rounds
        .filter(
          (rtg) =>
            rtg?.$isLoaded &&
            rtg.round?.$isLoaded &&
            playerRoundIds.has(rtg.round.$jazz.id),
        )
        .map((rtg) => rtg.$jazz.id),
    );

    // Remove RoundToGame entries that reference this player's rounds
    const roundsToKeep = game.rounds.filter((rtg) => {
      if (!rtg?.$isLoaded || !rtg.round?.$isLoaded) return true;
      return !playerRoundIds.has(rtg.round.$jazz.id);
    });

    // Clear and repopulate the rounds list
    game.rounds.$jazz.splice(0, game.rounds.length, ...roundsToKeep);

    // Remove team assignments for this player from all holes
    if (game.holes?.$isLoaded) {
      for (const hole of game.holes) {
        if (!hole?.$isLoaded || !hole.teams?.$isLoaded) continue;

        for (const team of hole.teams) {
          if (!team?.$isLoaded || !team.rounds?.$isLoaded) continue;

          // Filter out rounds that reference the deleted player
          const teamRoundsToKeep = team.rounds.filter((roundToTeam) => {
            if (!roundToTeam?.$isLoaded || !roundToTeam.roundToGame?.$isLoaded)
              return true;
            return !roundToGameIds.has(roundToTeam.roundToGame.$jazz.id);
          });

          // Update the team's rounds list
          team.rounds.$jazz.splice(0, team.rounds.length, ...teamRoundsToKeep);
        }

        // Remove teams that have no players left
        const teamsToKeep = hole.teams.filter((team) => {
          if (!team?.$isLoaded || !team.rounds?.$isLoaded) return true;
          return team.rounds.length > 0;
        });

        hole.teams.$jazz.splice(0, hole.teams.length, ...teamsToKeep);
      }
    }

    // Remove the player
    const idx = game.players.findIndex((p) => p?.$jazz?.id === player.$jazz.id);
    if (idx !== undefined && idx !== -1) {
      game.players.$jazz.splice(idx, 1);
    }
  };

  return (
    <TouchableOpacity onPress={() => deletePlayer()}>
      <FontAwesome6
        name="circle-xmark"
        size={24}
        color="#FF0000"
        iconStyle="solid"
      />
    </TouchableOpacity>
  );
}
