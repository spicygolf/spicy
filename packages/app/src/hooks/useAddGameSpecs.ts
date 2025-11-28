import type { Group } from "jazz-tools";
import { useAccount } from "jazz-tools/react-native";
import {
  GameOption,
  GameSpec,
  MapOfOptions,
  PlayerAccount,
  TeamsConfig,
} from "spicylib/schema";

export function useAddGameSpecs() {
  const me = useAccount(PlayerAccount, {
    resolve: {
      root: {
        specs: { $each: true },
      },
    },
  });

  const addGameSpecs = async (clearExisting = false) => {
    if (!me?.$isLoaded || !me.root?.$isLoaded || !me.root.specs?.$isLoaded) {
      return;
    }

    const specs = me.root.specs;
    const specsListOwner = specs.$jazz.owner;
    if (!specsListOwner) {
      return;
    }

    // Clear all existing specs if requested
    if (clearExisting) {
      while (specs.length > 0) {
        specs.$jazz.splice(0, 1);
      }
    }

    // Specs configuration - name is the unique identifier
    const specsToAddOrUpdate = [
      {
        name: "Five Points",
        short: `Team game with low ball (2), low team (2), and prox (1). 5 points per hole, presses, birdies`,
        long_description:
          "### Five Points\n\nClassic team game:\n* 2 teams of 2 players\n* Low ball: 2 points\n* Low team total: 2 points\n* Closest to pin: 1 point\n* 5 points per hole\n* Presses and birdies available",
        version: 1,
        status: "prod" as const,
        spec_type: "points" as const,
        min_players: 4,
        location_type: "local" as const,
        teamsConfig: {
          rotateEvery: 0, // Teams set in settings, don't rotate
          teamCount: 2,
          maxPlayersPerTeam: 2,
        },
      },
      {
        name: "Match Play",
        short:
          "Hole by hole scoring with lower (net if enabled) scores winning holes",
        long_description:
          "### Match Play\n\nClassic match play format:\n* Win, lose, or tie each hole\n* Lower score (gross or net) wins the hole\n* Most holes won wins the match\n* Can play singles or team format",
        version: 1,
        status: "prod" as const,
        spec_type: "points" as const,
        min_players: 2,
        location_type: "local" as const,
      },
      {
        name: "Nassau",
        short: "Three separate bets: front 9, back 9, and overall 18",
        long_description:
          "### Nassau\n\nThe classic three-way bet:\n* Front 9 winner\n* Back 9 winner\n* Overall 18 winner\n* Each segment is a separate bet\n* Can be played with automatic presses",
        version: 1,
        status: "prod" as const,
        spec_type: "points" as const,
        min_players: 2,
        location_type: "local" as const,
      },
      {
        name: "Wolf",
        short:
          "Rotating captain chooses partner or plays alone for double points",
        long_description:
          "### Wolf\n\nStrategic team game:\n* Rotating wolf (captain) each hole\n* Wolf chooses partner after tee shots\n* Or goes lone wolf for double points\n* Points based on team wins",
        version: 1,
        status: "prod" as const,
        spec_type: "points" as const,
        min_players: 3,
        location_type: "local" as const,
        teamsConfig: {
          rotateEvery: 1, // Teams change every hole
          teamCount: 2,
          teamLeadOrder: [], // Will be set during game creation
        },
      },
      {
        name: "Stableford",
        short: "Point-based scoring system rewarding aggressive play",
        long_description:
          "### Stableford\n\nPoint scoring system:\n* Eagle: 4 points\n* Birdie: 3 points\n* Par: 2 points\n* Bogey: 1 point\n* Double bogey+: 0 points\n* Highest total points wins",
        version: 1,
        status: "prod" as const,
        spec_type: "points" as const,
        min_players: 2,
        location_type: "local" as const,
      },
      {
        name: "Best Ball",
        short: "Team format using the best score among partners",
        long_description:
          "### Best Ball\n\nTeam competition:\n* Each player plays their own ball\n* Team uses best score on each hole\n* Can be 2-person or 4-person teams\n* Great for mixed skill levels",
        version: 1,
        status: "prod" as const,
        spec_type: "points" as const,
        min_players: 4,
        location_type: "local" as const,
        teamsConfig: {
          rotateEvery: 0, // Teams set in settings, don't rotate
          teamCount: 2,
          maxPlayersPerTeam: 2,
        },
      },
    ];

    for (const specData of specsToAddOrUpdate) {
      try {
        // Find existing spec by name
        let existingSpec = null;
        for (let i = 0; i < specs.length; i++) {
          const s = specs[i];
          if (s?.$isLoaded && s.name === specData.name) {
            existingSpec = s;
            break;
          }
        }

        if (existingSpec) {
          // Update existing spec
          // Update basic fields
          existingSpec.$jazz.set("short", specData.short);
          if (specData.long_description) {
            existingSpec.$jazz.set(
              "long_description",
              specData.long_description,
            );
          }
          existingSpec.$jazz.set("version", specData.version);
          existingSpec.$jazz.set("status", specData.status);
          existingSpec.$jazz.set("spec_type", specData.spec_type);
          existingSpec.$jazz.set("min_players", specData.min_players);
          existingSpec.$jazz.set("location_type", specData.location_type);

          // Update or set teamsConfig
          if ("teamsConfig" in specData && specData.teamsConfig) {
            const teamsConfig = TeamsConfig.create(specData.teamsConfig, {
              owner: specsListOwner,
            });
            existingSpec.$jazz.set("teamsConfig", teamsConfig);
          }

          // Add or update defaultOptions (idempotent)
          await addDefaultOptions(existingSpec, specsListOwner);
        } else {
          // Create new spec
          // Create TeamsConfig if it exists in specData
          let teamsConfig: ReturnType<typeof TeamsConfig.create> | undefined;
          if ("teamsConfig" in specData && specData.teamsConfig) {
            teamsConfig = TeamsConfig.create(specData.teamsConfig, {
              owner: specsListOwner,
            });
          }

          // Prepare the spec value without teamsConfig (will be set separately)
          const { teamsConfig: _, ...specValue } = specData;

          // Create the spec
          const newSpec = GameSpec.create(specValue, { owner: specsListOwner });

          // Set teamsConfig if it exists
          if (teamsConfig) {
            newSpec.$jazz.set("teamsConfig", teamsConfig);
          }

          // Add to specs list
          specs.$jazz.push(newSpec);

          // Add default options to new spec
          await addDefaultOptions(newSpec, specsListOwner);
        }
      } catch (error) {
        console.error(`Error adding/updating spec ${specData.name}:`, error);
      }
    }
  };

  // Helper function to add default options to a game spec (idempotent)
  const addDefaultOptions = async (
    spec: GameSpec,
    ownerGroup: Group,
  ): Promise<void> => {
    // Initialize options map if it doesn't exist
    if (!spec.$jazz.has("options")) {
      const optionsMap = MapOfOptions.create(
        {},
        {
          owner: ownerGroup,
        },
      );
      spec.$jazz.set("options", optionsMap);
    }

    const options = spec.options;
    if (!options?.$isLoaded) return;

    // Check if handicap_index_from option already exists
    const hasHandicapOption = options.handicap_index_from !== undefined;

    // Add handicap_index_from option if it doesn't exist
    if (!hasHandicapOption) {
      const handicapOption = GameOption.create(
        {
          name: "handicap_index_from",
          disp: "Index off of the low handicap or use full handicaps",
          type: "game",
          version: "0.5",
          valueType: "menu",
          defaultValue: "full",
        },
        { owner: ownerGroup },
      );

      // Create choices - inline co.list(co.map({name, disp}))
      const { co, z } = await import("jazz-tools");
      const ChoiceMap = co.map({
        name: z.string(),
        disp: z.string(),
      });
      const ChoiceList = co.list(ChoiceMap);
      const choices = ChoiceList.create([], { owner: ownerGroup });

      // Add choice options
      const lowChoice = ChoiceMap.create(
        { name: "low", disp: "Low" },
        { owner: ownerGroup },
      );
      const fullChoice = ChoiceMap.create(
        { name: "full", disp: "Full" },
        { owner: ownerGroup },
      );
      choices.$jazz.push(lowChoice);
      choices.$jazz.push(fullChoice);

      // Set choices on the option
      handicapOption.$jazz.set("choices", choices);

      // Add to options map using the option name as key
      options.$jazz.set("handicap_index_from", handicapOption);
    }
  };

  return { addGameSpecs };
}
