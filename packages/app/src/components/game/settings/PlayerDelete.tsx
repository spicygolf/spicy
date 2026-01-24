import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { TouchableOpacity } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import type { Game, GameSpec, Player } from "spicylib/schema";
import { getSpecField } from "spicylib/scoring";
import { useGame } from "@/hooks";
import { computeSpecForcesTeams } from "@/hooks/useTeamsMode";
import { reassignAllPlayersSeamless } from "@/utils/gameTeams";

export function PlayerDelete({ player }: { player: Player }) {
  const { game } = useGame(undefined, {
    resolve: {
      scope: { teamsConfig: true },
      specs: { $each: { teamsConfig: true } },
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

    // Collect RoundToGame IDs for team cleanup
    const roundToGameIds = new Set<string>();
    const playerRoundIds = new Set<string>();

    for (const rtg of playerRoundToGames) {
      if (!rtg?.$isLoaded || !rtg.round?.$isLoaded) continue;
      roundToGameIds.add(rtg.$jazz.id);
      playerRoundIds.add(rtg.round.$jazz.id);
    }

    // Remove RoundToGame entries that reference this player's rounds
    const roundsToKeep = game.rounds.filter((rtg) => {
      if (!rtg?.$isLoaded || !rtg.round?.$isLoaded) return true;
      return !playerRoundIds.has(rtg.round.$jazz.id);
    });

    // Clear and repopulate the rounds list
    game.rounds.$jazz.splice(0, game.rounds.length, ...roundsToKeep);

    // Note: Rounds without scores are now orphaned (no longer referenced by this game).
    // Jazz doesn't support explicit deletion of CoValues, but orphaned data without
    // scores is harmless. Rounds WITH scores are preserved since they may be
    // referenced by other games.

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

    // Check if we should revert to seamless mode
    // This happens when:
    // 1. Player count is now <= min_players
    // 2. User hasn't manually activated teams mode
    // 3. Spec doesn't force teams mode
    checkAndRevertToSeamlessMode(game);
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

/**
 * Checks if the game should revert to seamless mode after player removal.
 * If so, reassigns all players to individual teams (1:1).
 */
function checkAndRevertToSeamlessMode(game: Game): void {
  if (!game.$isLoaded) return;

  // Get specs
  const specs: GameSpec[] = [];
  if (game.specs?.$isLoaded) {
    for (const spec of game.specs) {
      if (spec?.$isLoaded) specs.push(spec);
    }
  }

  if (specs.length === 0) return;

  // Check if spec forces teams mode
  const specForcesTeams = specs.some(computeSpecForcesTeams);
  if (specForcesTeams) return; // Don't revert if spec forces teams

  // Check if user has manually activated teams mode
  const userActivated =
    game.scope?.$isLoaded &&
    game.scope.teamsConfig?.$isLoaded &&
    game.scope.teamsConfig.active === true;
  if (userActivated) return; // Don't revert if user manually activated

  // Get min_players from specs
  const minPlayers = Math.min(
    ...specs.map((s) => (getSpecField(s, "min_players") as number) ?? 2),
  );

  // Current player count (after removal)
  const playerCount = game.players?.$isLoaded ? game.players.length : 0;

  // If we're at or below min_players, revert to seamless mode
  if (playerCount <= minPlayers) {
    reassignAllPlayersSeamless(game);
  }
}
