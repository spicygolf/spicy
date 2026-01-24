import { Group } from "jazz-tools";
import { useAccount } from "jazz-tools/react-native";
import type { GameSpec, MapOfOptions, Option } from "spicylib/schema";
import {
  Game,
  GameOption,
  GameScope,
  JunkOption,
  ListOfGameHoles,
  ListOfGameSpecs,
  ListOfPlayers,
  ListOfRoundToGames,
  MetaOption,
  MultiplierOption,
  PlayerAccount,
  SpecSnapshot,
  StringList,
} from "spicylib/schema";
import { addPlayerToGameCore } from "../utils/addPlayerToGameCore";
import { reportError } from "../utils/reportError";
import { useJazzWorker } from "./useJazzWorker";

/**
 * Deep copy a single option to a new CoMap owned by the given group.
 * This ensures game-level options are independent from spec options.
 */
function copyOption(option: Option, group: Group): Option | null {
  if (!option?.$isLoaded) return null;

  switch (option.type) {
    case "game": {
      // Note: choices are not copied - they're read-only reference data
      // If needed, the original spec's choices can still be accessed
      return GameOption.create(
        {
          name: option.name,
          disp: option.disp,
          type: "game",
          version: option.version,
          valueType: option.valueType,
          defaultValue: option.defaultValue,
          value: option.value,
          seq: option.seq,
          teamOnly: option.teamOnly,
        },
        { owner: group },
      );
    }
    case "junk": {
      return JunkOption.create(
        {
          name: option.name,
          disp: option.disp,
          type: "junk",
          version: option.version,
          sub_type: option.sub_type,
          value: option.value,
          seq: option.seq,
          scope: option.scope,
          icon: option.icon,
          show_in: option.show_in,
          based_on: option.based_on,
          limit: option.limit,
          calculation: option.calculation,
          logic: option.logic,
          better: option.better,
          score_to_par: option.score_to_par,
        },
        { owner: group },
      );
    }
    case "multiplier": {
      return MultiplierOption.create(
        {
          name: option.name,
          disp: option.disp,
          type: "multiplier",
          version: option.version,
          sub_type: option.sub_type,
          value: option.value,
          seq: option.seq,
          icon: option.icon,
          based_on: option.based_on,
          scope: option.scope,
          availability: option.availability,
          override: option.override,
          value_from: option.value_from,
          input_value: option.input_value,
        },
        { owner: group },
      );
    }
    case "meta": {
      // For text_array, we need to copy the array
      let valueArray: ReturnType<typeof StringList.create> | undefined;
      if (option.valueType === "text_array" && option.valueArray?.$isLoaded) {
        valueArray = StringList.create([...option.valueArray], {
          owner: group,
        });
      }
      // Note: choices are not copied - they're read-only reference data
      return MetaOption.create(
        {
          name: option.name,
          disp: option.disp,
          type: "meta",
          valueType: option.valueType,
          value: option.value,
          valueArray,
          seq: option.seq,
          searchable: option.searchable,
          required: option.required,
        },
        { owner: group },
      );
    }
    default:
      return null;
  }
}

/**
 * Deep copy all options from a spec to new CoMaps owned by the given group.
 * Returns a new MapOfOptions record with copied options.
 */
async function copySpecOptions(
  spec: GameSpec,
  group: Group,
): Promise<MapOfOptions | undefined> {
  if (!spec.options?.$isLoaded) return undefined;

  // Import the MapOfOptions type to create a new record
  const { MapOfOptions } = await import("spicylib/schema");
  const copiedOptions = MapOfOptions.create({}, { owner: group });

  for (const key of Object.keys(spec.options)) {
    if (key.startsWith("$") || key === "_refs" || key === "_schema") continue;

    const option = spec.options[key];
    if (!option?.$isLoaded) continue;

    const copiedOption = copyOption(option, group);
    if (copiedOption) {
      // Use $jazz.set for Jazz CoRecord
      // biome-ignore lint/suspicious/noExplicitAny: Jazz type compatibility between loaded/unloaded states
      copiedOptions.$jazz.set(key, copiedOption as any);
    }
  }

  return copiedOptions;
}

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

    // Create spec snapshot (deep copy of spec options for historical consistency)
    // This ensures scoring rules don't change if the catalog spec is updated
    let specSnapshot: ReturnType<typeof SpecSnapshot.create> | undefined;
    if (firstSpec?.$isLoaded) {
      // Ensure options are loaded
      const loadedSpec = await firstSpec.$jazz.ensureLoaded({
        resolve: { options: { $each: true } },
      });

      const copiedOptions = await copySpecOptions(loadedSpec, group);

      specSnapshot = SpecSnapshot.create(
        {
          name: loadedSpec.name,
          version: loadedSpec.version,
          options: copiedOptions,
        },
        { owner: group },
      );
    }

    // Create the game
    const game = Game.create(
      {
        start: new Date(),
        name,
        scope,
        // New architecture: specRef + specSnapshot
        specRef: firstSpec,
        specSnapshot,
        // Backwards compat: also populate specs array
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
