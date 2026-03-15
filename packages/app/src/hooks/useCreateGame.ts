import { Group } from "jazz-tools";
import { useAccount } from "jazz-tools/react-native";
import type { GameSpec } from "spicylib/schema";
import {
  Bet,
  Game,
  GameScope,
  ListOfBets,
  ListOfGameHoles,
  ListOfPlayers,
  ListOfRoundToGames,
  PlayerAccount,
  TeamsConfig,
} from "spicylib/schema";
import { copySpecOptions, getMetaOption, getSpecField } from "spicylib/scoring";
import {
  addPlayerToGameCore,
  calculateTeamCount,
  getDefaultTeeTime,
} from "spicylib/utils";
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

    // Create bets from the spec's bets meta option (JSON string)
    const bets = createBetsFromSpec(firstSpec, group);

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
        bets: bets.length > 0 ? bets : undefined,
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
        {
          autoCreateRound: true,
          allGames: me.root.games,
          onError: (error, opts) => reportError(error, opts),
        },
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
 * Create Bet CoMaps from bet options on the spec.
 *
 * Reads type:"bet" options from the GameSpec options map.
 * Falls back to parsing the legacy JSON meta option for existing games.
 * Returns an empty list if no bets are defined.
 */
function createBetsFromSpec(
  spec: GameSpec | undefined,
  owner: Group,
): ListOfBets {
  const bets = ListOfBets.create([], { owner });
  if (!spec?.$isLoaded) return bets;

  // Collect bet options from the spec's options map
  const betOptions: Array<{
    name: string;
    disp: string;
    scope: "front9" | "back9" | "all18" | "rest_of_nine" | "rest_of_round";
    scoringType: "quota" | "skins" | "points" | "match";
    pct?: number;
    amount?: number;
    splitType: "places" | "per_unit" | "winner_take_all";
  }> = [];

  for (const key of Object.keys(spec)) {
    if (key.startsWith("$") || key.startsWith("_")) continue;
    if (!spec.$jazz.has(key)) continue;
    const opt = spec[key];
    if (opt?.type === "bet") {
      betOptions.push(opt);
    }
  }

  if (betOptions.length > 0) {
    for (const b of betOptions) {
      const bet = Bet.create(
        {
          name: b.name,
          disp: b.disp,
          scope: b.scope,
          scoringType: b.scoringType,
          splitType: b.splitType,
          ...(b.pct !== undefined && { pct: b.pct }),
          ...(b.amount !== undefined && { amount: b.amount }),
        },
        { owner },
      );
      bets.$jazz.push(bet);
    }
    return bets;
  }

  // Legacy fallback: parse bets from JSON meta option
  const betsJson = getMetaOption(spec, "bets") as string | undefined;
  if (!betsJson) return bets;

  try {
    const parsed = JSON.parse(betsJson) as Array<{
      name: string;
      disp: string;
      scope: "front9" | "back9" | "all18" | "rest_of_nine" | "rest_of_round";
      scoringType: "quota" | "skins" | "points" | "match";
      pct: number;
      splitType: "places" | "per_unit" | "winner_take_all";
      placesPaid?: number;
    }>;

    for (const b of parsed) {
      const bet = Bet.create(
        {
          name: b.name,
          disp: b.disp,
          scope: b.scope,
          scoringType: b.scoringType,
          pct: b.pct,
          splitType: b.splitType,
          placesPaid: b.placesPaid,
        },
        { owner },
      );
      bets.$jazz.push(bet);
    }
  } catch (e) {
    reportError("Failed to parse bets meta option", {
      source: "createBetsFromSpec",
      type: "DataError",
      context: { betsJson, error: String(e) },
    });
  }

  return bets;
}
