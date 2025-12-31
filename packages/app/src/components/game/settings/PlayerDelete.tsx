import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { TouchableOpacity } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import type { Player } from "spicylib/schema";
import { useGame } from "@/hooks";

export function PlayerDelete({ player }: { player: Player }) {
  const { game } = useGame(undefined, {
    resolve: {
      players: true,
      rounds: {
        $each: {
          round: {
            playerId: true,
          },
        },
      },
      holes: {
        $each: {
          teams: {
            $each: {
              rounds: {
                $each: {
                  roundToGame: true,
                },
              },
            },
          },
        },
      },
    },
  });
  const { theme } = useUnistyles();

  const deletePlayer = () => {
    // TODO: detect whether there are other things in the game linked to this
    //       player, and if so, show a dialog to the user, confirming delete.
    if (!game?.$isLoaded || !game.players?.$isLoaded || !game.rounds?.$isLoaded)
      return;
    if (!player?.$isLoaded) return;

    // Find all RoundToGame entries for this player using round.playerId
    // (more reliable than player.rounds since catalog players may not have rounds list access)
    const playerRoundToGames = game.rounds.filter(
      (rtg) =>
        rtg?.$isLoaded &&
        rtg.round?.$isLoaded &&
        rtg.round.playerId === player.$jazz.id,
    );

    // Get round IDs and RoundToGame IDs for this player
    const playerRoundIds = new Set(
      playerRoundToGames
        .filter((rtg) => rtg?.$isLoaded && rtg.round?.$isLoaded)
        .map((rtg) => {
          if (rtg?.$isLoaded && rtg.round?.$isLoaded) {
            return rtg.round.$jazz.id;
          }
          return "";
        })
        .filter((id) => id !== ""),
    );

    const roundToGameIds = new Set(
      playerRoundToGames
        .filter((rtg) => rtg?.$isLoaded)
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
      for (const hole of game.holes as Iterable<(typeof game.holes)[number]>) {
        if (!hole?.$isLoaded || !hole.teams?.$isLoaded) continue;

        for (const team of hole.teams as Iterable<
          (typeof hole.teams)[number]
        >) {
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
        name="delete-left"
        size={18}
        color={theme.colors.secondary}
        iconStyle="solid"
      />
    </TouchableOpacity>
  );
}
