import { Group } from "jazz-tools";
import { useAccount } from "jazz-tools/react-native";
import type { GameSpec } from "spicylib/schema";
import {
  Game,
  GameScope,
  ListOfGameHoles,
  ListOfGameSpecs,
  ListOfPlayers,
  ListOfRoundToGames,
  PlayerAccount,
} from "spicylib/schema";
import { addPlayerToGameCore } from "../utils/addPlayerToGameCore";
import { playerToPlayerData } from "../utils/playerToPlayerData";
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
      console.error("useCreateGame: Account root doesn't have games field");
      return null;
    }

    if (!me.root.games?.$isLoaded) {
      console.error("useCreateGame: Account games list not loaded");
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

    // Create an empty list and push the spec references
    // We can't pass existing specs to create() because they may have different owners
    const gameSpecs = ListOfGameSpecs.create([], { owner: group });
    for (const spec of specs) {
      if (spec?.$isLoaded) {
        // biome-ignore lint/suspicious/noExplicitAny: Jazz list type compatibility
        gameSpecs.$jazz.push(spec as any);
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

    // If the first spec has a teamsConfig, create a copy for the game scope
    const firstSpec = specs[0];

    if (firstSpec?.$isLoaded && firstSpec.$jazz.has("teamsConfig")) {
      // Ensure teamsConfig is loaded before reading its values
      const loadedSpec = await firstSpec.$jazz.ensureLoaded({
        resolve: { teamsConfig: true },
      });

      if (loadedSpec.teamsConfig?.$isLoaded) {
        // Create a new TeamsConfig instance for this game with the spec's values
        const { TeamsConfig } = await import("spicylib/schema");
        const teamsConfig = TeamsConfig.create(
          {
            rotateEvery: loadedSpec.teamsConfig.rotateEvery,
            teamCount: loadedSpec.teamsConfig.teamCount,
            maxPlayersPerTeam: loadedSpec.teamsConfig.maxPlayersPerTeam,
            teamLeadOrder: loadedSpec.teamsConfig.teamLeadOrder,
          },
          { owner: group },
        );
        scope.$jazz.set("teamsConfig", teamsConfig);
      }
    }

    // Create the game
    const game = Game.create(
      {
        start: new Date(),
        name,
        scope,
        specs: gameSpecs,
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
    // The game was just created synchronously with the players list,
    // so it should be loaded, but we check defensively
    if (
      me.root.player?.$isLoaded &&
      game.$isLoaded &&
      game.players?.$isLoaded
    ) {
      const playerData = playerToPlayerData(me.root.player);
      const result = await addPlayerToGameCore(
        game,
        playerData,
        worker?.account?.$isLoaded ? worker.account : undefined,
      );

      if (result.isErr()) {
        console.error("Failed to add current player to game:", result.error);
      }
    }

    return game;
  };

  return { createGame };
}
