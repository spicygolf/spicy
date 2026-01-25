import { Group } from "jazz-tools";
import { useAccount } from "jazz-tools/react-native";
import type { GameSpec } from "spicylib/schema";
import {
  Game,
  GameScope,
  ListOfGameHoles,
  ListOfPlayers,
  ListOfRoundToGames,
  PlayerAccount,
} from "spicylib/schema";
import { copySpecOptions } from "spicylib/scoring";
import { addPlayerToGameCore } from "../utils/addPlayerToGameCore";
import { reportError } from "../utils/reportError";
import { useJazzWorker } from "./useJazzWorker";

export function useCreateGame() {
  const me = useAccount(PlayerAccount, {
    resolve: {
      root: {
        player: {
          handicap: true,
        },
        games: { $each: true },
      },
    },
  });
  const worker = useJazzWorker();

  const createGame = async (name: string, specs: GameSpec[]) => {
    if (!me?.$isLoaded || !me.root?.$isLoaded) {
      return null;
    }

    if (!me.root.$jazz.has("games")) {
      reportError("Account root doesn't have games field", {
        source: "useCreateGame",
        type: "DataError",
      });
      return null;
    }

    if (!me.root.games?.$isLoaded) {
      reportError("Account games list not loaded", {
        source: "useCreateGame",
        type: "DataError",
      });
      return null;
    }

    const group = Group.create(me);
    group.addMember(me, "admin");

    // Give worker account admin access for sync
    if (worker?.account?.$isLoaded) {
      try {
        group.addMember(worker.account, "admin");
      } catch (_e) {
        // Ignore - might already be a member
      }
    }

    // Create players list
    const players = ListOfPlayers.create([], { owner: group });

    // Create game holes list (empty for now)
    const holes = ListOfGameHoles.create([], { owner: group });

    // Create round to games list (empty for now)
    const roundToGames = ListOfRoundToGames.create([], { owner: group });

    // Create game scope - start with just holes, add teamsConfig later if needed
    const scope = GameScope.create(
      {
        holes: "all18",
      },
      { owner: group },
    );

    // If the first spec has team config options, create a TeamsConfig for the game scope
    const firstSpec = specs[0];

    // GameSpec IS the options map directly
    if (firstSpec?.$isLoaded) {
      const { getSpecField } = await import("spicylib/scoring");
      const teams = getSpecField(firstSpec, "teams") as boolean;
      const teamChangeEvery = getSpecField(
        firstSpec,
        "team_change_every",
      ) as number;
      const teamSize = getSpecField(firstSpec, "team_size") as number;
      const minPlayers =
        (getSpecField(firstSpec, "min_players") as number) ?? 2;

      // Only create teamsConfig if spec has teams enabled or team-related options
      if (teams || teamChangeEvery || teamSize) {
        const { TeamsConfig } = await import("spicylib/schema");
        const teamsConfig = TeamsConfig.create(
          {
            rotateEvery: teamChangeEvery ?? 0,
            teamCount: minPlayers, // Default to one team per player
            maxPlayersPerTeam: teamSize ?? 0,
          },
          { owner: group },
        );
        scope.$jazz.set("teamsConfig", teamsConfig);
      }
    }

    // Copy spec options to create the game's working copy
    // spec = working copy (user modifications go here)
    // specRef = reference to catalog spec (for reset/diff)
    const spec = copySpecOptions(firstSpec, group);

    // Create the game
    const game = Game.create(
      {
        start: new Date(),
        name,
        scope,
        spec,
        specRef: firstSpec,
        holes,
        players,
        rounds: roundToGames,
      },
      { owner: group },
    );

    // Add game to user's games list
    if (me.root.games?.$isLoaded) {
      me.root.games.$jazz.push(game);
    }

    // Auto-add current player to the game
    // Pass the player REFERENCE directly - don't extract data and recreate
    // This ensures the same player CoValue is used across all games
    if (
      me.root.player?.$isLoaded &&
      game.$isLoaded &&
      game.players?.$isLoaded
    ) {
      const result = await addPlayerToGameCore(
        game,
        { player: me.root.player }, // Pass reference, not data
        worker?.account?.$isLoaded ? worker.account : undefined,
        { autoCreateRound: true },
      );

      if (result.isErr()) {
        reportError(result.error.message, {
          source: "useCreateGame",
          type: result.error.type,
          context: { gameId: game.$jazz.id },
        });
      }
    }

    return game;
  };

  return { createGame };
}
