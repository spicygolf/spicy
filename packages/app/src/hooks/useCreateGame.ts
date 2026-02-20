import { Group } from "jazz-tools";
import { useAccount } from "jazz-tools/react-native";
import type { GameSpec } from "spicylib/schema";
import {
  Game,
  GameScope,
  ListOfGameHoles,
  ListOfPayoutPools,
  ListOfPlayers,
  ListOfRoundToGames,
  PayoutPool,
  PlayerAccount,
  TeamsConfig,
} from "spicylib/schema";
import { copySpecOptions, getMetaOption, getSpecField } from "spicylib/scoring";
import { calculateTeamCount, getDefaultTeeTime } from "spicylib/utils";
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
      const teams = getSpecField(firstSpec, "teams") as boolean;
      const teamChangeEvery = getSpecField(
        firstSpec,
        "team_change_every",
      ) as number;
      const teamSize = getSpecField(firstSpec, "team_size") as number;
      const numTeams = getSpecField(firstSpec, "num_teams") as number;
      const minPlayers =
        (getSpecField(firstSpec, "min_players") as number) ?? 2;

      // Only create teamsConfig if spec has teams enabled or team-related options
      if (teams || teamChangeEvery || teamSize || numTeams) {
        const calculatedTeamCount = calculateTeamCount({
          numTeams,
          teamSize: teams ? teamSize : undefined, // Only use team_size if teams enabled
          minPlayers,
          fallback: minPlayers,
        });

        // maxPlayersPerTeam is a soft guideline, not a hard constraint.
        // When undefined, teams can have any number of players (laissez-faire).
        // Even when set, we allow flexibility (e.g., 3v2 instead of strict 2v2).
        // Treat 0 as undefined (no limit).
        const teamsConfig = TeamsConfig.create(
          {
            rotateEvery: teamChangeEvery ?? 0,
            teamCount: calculatedTeamCount,
            maxPlayersPerTeam: teamSize && teamSize > 0 ? teamSize : undefined,
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

    // Create payout pools from the spec's payout_pools meta option (JSON string)
    const payoutPools = createPayoutPoolsFromSpec(firstSpec, group);

    // Create the game
    const game = Game.create(
      {
        start: getDefaultTeeTime(new Date()),
        name,
        scope,
        spec,
        specRef: firstSpec,
        holes,
        players,
        rounds: roundToGames,
        organizer: me.$jazz.id,
        payoutPools,
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
        { autoCreateRound: true, allGames: me.root.games },
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

/**
 * Parse payout_pools meta option (JSON string) and create PayoutPool CoMaps.
 * Falls back to a single 100% winner-take-all pool if no pools are defined.
 */
function createPayoutPoolsFromSpec(
  spec: GameSpec | undefined,
  owner: Group,
): ListOfPayoutPools {
  const pools = ListOfPayoutPools.create([], { owner });

  const poolsJson = getMetaOption(spec, "payout_pools") as string | undefined;
  if (!poolsJson) return pools;

  try {
    const parsed = JSON.parse(poolsJson) as Array<{
      name: string;
      disp: string;
      pct: number;
      metric: string;
      splitType: "places" | "per_unit" | "winner_take_all";
      placesPaid?: number;
      payoutPcts?: number[];
    }>;

    for (const p of parsed) {
      const pool = PayoutPool.create(
        {
          name: p.name,
          disp: p.disp,
          pct: p.pct,
          metric: p.metric,
          splitType: p.splitType,
          placesPaid: p.placesPaid,
        },
        { owner },
      );
      pools.$jazz.push(pool);
    }
  } catch {
    // Invalid JSON - return empty pools
  }

  return pools;
}
