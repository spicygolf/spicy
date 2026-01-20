/**
 * GameCatalog Management Utilities (API Server)
 *
 * Implements catalog CRUD operations for the worker account.
 * Handles idempotent imports from ArangoDB and JSON sources.
 */

import { type co, Group } from "jazz-tools";

/**
 * Validation helpers for option type assertions
 */
const VALID_JUNK_SUB_TYPES = ["dot", "skin", "carryover"] as const;
const VALID_MULTIPLIER_SUB_TYPES = ["bbq", "press", "automatic"] as const;
const VALID_JUNK_SCOPES = [
  "player",
  "team",
  "hole",
  "rest_of_nine",
  "game",
] as const;
const VALID_MULTIPLIER_SCOPES = [
  "player",
  "team",
  "none",
  "hole",
  "rest_of_nine",
  "game",
] as const;
const VALID_SHOW_IN = ["score", "faves", "none"] as const;
const VALID_BASED_ON = ["gross", "net", "user"] as const;
const VALID_BETTER = ["lower", "higher"] as const;

function isValidJunkSubType(
  value: unknown,
): value is "dot" | "skin" | "carryover" {
  return (
    typeof value === "string" &&
    (VALID_JUNK_SUB_TYPES as readonly string[]).includes(value)
  );
}

function isValidMultiplierSubType(
  value: unknown,
): value is "bbq" | "press" | "automatic" {
  return (
    typeof value === "string" &&
    (VALID_MULTIPLIER_SUB_TYPES as readonly string[]).includes(value)
  );
}

function isValidJunkScope(
  value: unknown,
): value is "player" | "team" | "hole" | "rest_of_nine" | "game" {
  return (
    typeof value === "string" &&
    (VALID_JUNK_SCOPES as readonly string[]).includes(value)
  );
}

function isValidMultiplierScope(
  value: unknown,
): value is "player" | "team" | "none" | "hole" | "rest_of_nine" | "game" {
  return (
    typeof value === "string" &&
    (VALID_MULTIPLIER_SCOPES as readonly string[]).includes(value)
  );
}

function isValidShowIn(value: unknown): value is "score" | "faves" | "none" {
  return (
    typeof value === "string" &&
    (VALID_SHOW_IN as readonly string[]).includes(value)
  );
}

function isValidBasedOn(value: unknown): value is "gross" | "net" | "user" {
  return (
    typeof value === "string" &&
    (VALID_BASED_ON as readonly string[]).includes(value)
  );
}

function isValidBetter(value: unknown): value is "lower" | "higher" {
  return (
    typeof value === "string" &&
    (VALID_BETTER as readonly string[]).includes(value)
  );
}

import {
  ChoiceMap,
  ChoicesList,
  Club,
  Course,
  CourseDefaultTee,
  Game,
  type GameCatalog,
  GameHole,
  GameOption,
  GameScope,
  GameSpec,
  Handicap,
  HoleScores,
  JunkOption,
  ListOfClubs,
  ListOfGameHoles,
  ListOfGameSpecs,
  ListOfPlayers,
  ListOfRounds,
  ListOfRoundToGames,
  ListOfRoundToTeams,
  ListOfTeamOptions,
  ListOfTeams,
  ListOfTeeHoles,
  ListOfTees,
  MapOfCourses,
  type MapOfGameSpecs,
  MapOfGames,
  MapOfOptions,
  MapOfPlayers,
  MultiplierOption,
  Player,
  type PlayerAccount,
  Round,
  RoundScores,
  RoundToGame,
  RoundToTeam,
  Team,
  TeamOption,
  TeamsConfig,
  Tee,
  TeeHole,
} from "spicylib/schema";
import { transformGameSpec } from "spicylib/transform";
import { formatHandicapDisplay } from "spicylib/utils";

import {
  type ArangoConfig,
  type ArangoTeeRating,
  convertArangoRatings,
  createArangoConnection,
  defaultConfig,
  fetchAllGames,
  fetchGameWithRounds,
  fetchPlayersWithGames,
  type GameSpecV03,
  type GameWithRoundsV03,
  type RoundToGameEdgeV03,
  type RoundV03,
} from "../utils/arango";

export interface ImportResult {
  specs: {
    created: number;
    updated: number;
    skipped: number;
  };
  options: {
    created: number;
    updated: number;
  };
  players: {
    created: number;
    updated: number;
    skipped: number;
  };
  errors: Array<{ item: string; error: string }>;
}

/**
 * Union type for all option data shapes
 */
interface GameOptionData {
  type: "game";
  name: string;
  disp: string;
  version: string;
  valueType: "bool" | "num" | "menu" | "text";
  defaultValue: string;
  seq?: number;
  choices?: Array<{ name: string; disp: string }>;
  teamOnly?: boolean;
}

interface JunkOptionData {
  type: "junk";
  name: string;
  disp: string;
  version: string;
  sub_type?: string;
  value: number;
  seq?: number;
  scope?: string;
  icon?: string;
  show_in?: string;
  based_on?: string;
  limit?: string;
  calculation?: string;
  logic?: string;
  better?: string;
  score_to_par?: string;
}

interface MultiplierOptionData {
  type: "multiplier";
  name: string;
  disp: string;
  version: string;
  sub_type?: string;
  value?: number;
  seq?: number;
  icon?: string;
  based_on?: string;
  scope?: string;
  availability?: string;
  override?: boolean;
  input_value?: boolean;
  value_from?: string;
}

type OptionData = GameOptionData | JunkOptionData | MultiplierOptionData;

/**
 * Load the GameCatalog for the worker account
 */
export async function loadOrCreateCatalog(
  workerAccount: co.loaded<typeof PlayerAccount>,
): Promise<GameCatalog> {
  const loadedAccount = await workerAccount.$jazz.ensureLoaded({
    resolve: { profile: { catalog: true } },
  });

  if (!loadedAccount.profile) {
    throw new Error("Worker account has no profile");
  }

  const profile = loadedAccount.profile;

  if (!profile.$jazz.has("catalog")) {
    throw new Error("Worker account catalog not initialized");
  }

  const catalog = profile.catalog;
  if (!catalog) {
    throw new Error("Catalog is null despite $jazz.has check");
  }

  return catalog;
}

/**
 * Upsert a game spec into the catalog (idempotent)
 *
 * If the spec already exists, updates it in place to preserve CoValue ID.
 * This is critical for maintaining references from existing games.
 */
export async function upsertGameSpec(
  catalog: GameCatalog,
  specData: GameSpecV03,
  catalogOptions?: MapOfOptions,
): Promise<{ created: boolean; updated: boolean }> {
  const loadedCatalog = await catalog.$jazz.ensureLoaded({
    resolve: { specs: { $each: { teamsConfig: true } }, options: {} },
  });

  if (!loadedCatalog.specs) {
    throw new Error("Catalog specs is null");
  }

  const specs: MapOfGameSpecs = loadedCatalog.specs;
  const key = `${specData.disp}-${specData.version}`;
  const exists = specs.$jazz.has(key);
  const transformed = transformGameSpec(specData);

  // Get or create the spec
  let spec: GameSpec;
  if (exists) {
    // Update existing spec in place to preserve CoValue ID
    const existingSpec = specs[key];
    if (!existingSpec?.$isLoaded) {
      throw new Error(`Existing spec ${key} failed to load`);
    }
    spec = existingSpec;

    // Update fields on existing spec
    spec.$jazz.set("name", transformed.name);
    spec.$jazz.set("short", transformed.short);
    spec.$jazz.set("version", transformed.version);
    spec.$jazz.set("status", transformed.status);
    spec.$jazz.set("spec_type", transformed.spec_type);
    spec.$jazz.set("min_players", transformed.min_players || 1);
    spec.$jazz.set("location_type", transformed.location_type || "local");
  } else {
    // Create new spec
    spec = GameSpec.create(
      {
        name: transformed.name,
        short: transformed.short,
        version: transformed.version,
        status: transformed.status,
        spec_type: transformed.spec_type,
        min_players: transformed.min_players || 1,
        location_type: transformed.location_type || "local",
      },
      { owner: specs.$jazz.owner },
    );
  }

  // Set legacyId from ArangoDB _key for matching during game import
  if (specData._key) {
    spec.$jazz.set("legacyId", specData._key);
  }

  if (transformed.long_description) {
    spec.$jazz.set("long_description", transformed.long_description);
  }

  // Create or update TeamsConfig from v0.3 team fields
  if (
    specData.teams !== undefined ||
    specData.team_change_every !== undefined
  ) {
    const rotateEvery = specData.team_change_every ?? 0;

    // Validate min_players before calculating teamCount
    if (!specData.min_players || specData.min_players < 1) {
      console.warn(
        `GameSpec ${specData.name} has invalid min_players: ${specData.min_players}, skipping TeamsConfig`,
      );
    } else {
      // Calculate teamCount based on v0.3 data
      let teamCount: number;
      if (specData.teams === false) {
        teamCount = specData.min_players;
      } else if (specData.team_size && specData.team_size > 0) {
        teamCount = Math.ceil(specData.min_players / specData.team_size);
      } else {
        teamCount = specData.min_players;
      }

      // Update existing teamsConfig or create new one
      // Use $jazz.has() to check if property exists (proper Jazz pattern)
      // Also check $isLoaded for TypeScript type narrowing
      if (spec.$jazz.has("teamsConfig") && spec.teamsConfig?.$isLoaded) {
        spec.teamsConfig.$jazz.set("teamCount", teamCount);
        spec.teamsConfig.$jazz.set("rotateEvery", rotateEvery);
        if (specData.team_size && specData.team_size > 0) {
          spec.teamsConfig.$jazz.set("maxPlayersPerTeam", specData.team_size);
        }
      } else {
        const teamsConfig = TeamsConfig.create(
          { teamCount, rotateEvery },
          { owner: specs.$jazz.owner },
        );
        if (specData.team_size && specData.team_size > 0) {
          teamsConfig.$jazz.set("maxPlayersPerTeam", specData.team_size);
        }
        spec.$jazz.set("teamsConfig", teamsConfig);
      }
    }
  }

  // Build spec.options with references to catalog options OR create new options with overrides
  if (transformed.options && transformed.options.length > 0 && catalogOptions) {
    const specOptionsMap: Record<string, unknown> = {};

    for (const opt of transformed.options) {
      const catalogOption = catalogOptions[opt.name];
      if (!catalogOption) continue;

      // For junk options, check if the spec has an overridden value
      if (opt.type === "junk" && "value" in opt) {
        if (!catalogOption.$isLoaded) {
          specOptionsMap[opt.name] = catalogOption;
          continue;
        }
        const loadedCatalogOpt = catalogOption;

        // If values differ, create a new JunkOption with the spec's overridden value
        if (
          loadedCatalogOpt.$isLoaded &&
          loadedCatalogOpt.type === "junk" &&
          loadedCatalogOpt.value !== opt.value
        ) {
          const junkData = specData.junk?.find((j) => j.name === opt.name);
          if (junkData) {
            const newJunkOption = JunkOption.create(
              {
                name: loadedCatalogOpt.name,
                disp: loadedCatalogOpt.disp,
                type: "junk",
                version: loadedCatalogOpt.version,
                value: opt.value,
              },
              { owner: specs.$jazz.owner },
            );

            if (loadedCatalogOpt.sub_type)
              newJunkOption.$jazz.set("sub_type", loadedCatalogOpt.sub_type);
            if (loadedCatalogOpt.seq !== undefined)
              newJunkOption.$jazz.set("seq", loadedCatalogOpt.seq);
            if (loadedCatalogOpt.scope)
              newJunkOption.$jazz.set("scope", loadedCatalogOpt.scope);
            if (loadedCatalogOpt.icon)
              newJunkOption.$jazz.set("icon", loadedCatalogOpt.icon);
            if (loadedCatalogOpt.show_in)
              newJunkOption.$jazz.set("show_in", loadedCatalogOpt.show_in);
            if (loadedCatalogOpt.based_on)
              newJunkOption.$jazz.set("based_on", loadedCatalogOpt.based_on);
            if (loadedCatalogOpt.limit)
              newJunkOption.$jazz.set("limit", loadedCatalogOpt.limit);
            if (loadedCatalogOpt.calculation)
              newJunkOption.$jazz.set(
                "calculation",
                loadedCatalogOpt.calculation,
              );
            if (loadedCatalogOpt.logic)
              newJunkOption.$jazz.set("logic", loadedCatalogOpt.logic);
            if (loadedCatalogOpt.better)
              newJunkOption.$jazz.set("better", loadedCatalogOpt.better);
            if (loadedCatalogOpt.score_to_par)
              newJunkOption.$jazz.set(
                "score_to_par",
                loadedCatalogOpt.score_to_par,
              );

            specOptionsMap[opt.name] = newJunkOption;
            continue;
          }
        }
      }

      // For multiplier options, check if the spec has an overridden value
      if (opt.type === "multiplier" && "value" in opt) {
        if (!catalogOption.$isLoaded) {
          specOptionsMap[opt.name] = catalogOption;
          continue;
        }
        const loadedCatalogOpt = catalogOption;

        if (
          loadedCatalogOpt.$isLoaded &&
          loadedCatalogOpt.type === "multiplier" &&
          loadedCatalogOpt.value !== opt.value
        ) {
          const newMultOption = MultiplierOption.create(
            {
              name: loadedCatalogOpt.name,
              disp: loadedCatalogOpt.disp,
              type: "multiplier",
              version: loadedCatalogOpt.version,
              value: opt.value,
            },
            { owner: specs.$jazz.owner },
          );

          if (loadedCatalogOpt.sub_type)
            newMultOption.$jazz.set("sub_type", loadedCatalogOpt.sub_type);
          if (loadedCatalogOpt.seq !== undefined)
            newMultOption.$jazz.set("seq", loadedCatalogOpt.seq);
          if (loadedCatalogOpt.icon)
            newMultOption.$jazz.set("icon", loadedCatalogOpt.icon);
          if (loadedCatalogOpt.based_on)
            newMultOption.$jazz.set("based_on", loadedCatalogOpt.based_on);
          if (loadedCatalogOpt.scope)
            newMultOption.$jazz.set("scope", loadedCatalogOpt.scope);
          if (loadedCatalogOpt.availability)
            newMultOption.$jazz.set(
              "availability",
              loadedCatalogOpt.availability,
            );
          if (loadedCatalogOpt.override !== undefined)
            newMultOption.$jazz.set("override", loadedCatalogOpt.override);
          if (loadedCatalogOpt.input_value !== undefined)
            newMultOption.$jazz.set(
              "input_value",
              loadedCatalogOpt.input_value,
            );
          if (loadedCatalogOpt.value_from)
            newMultOption.$jazz.set("value_from", loadedCatalogOpt.value_from);

          specOptionsMap[opt.name] = newMultOption;
          continue;
        }
      }

      // Default: reference the catalog option directly (no override needed)
      specOptionsMap[opt.name] = catalogOption;
    }

    spec.$jazz.set("options", specOptionsMap as MapOfOptions);
  }

  // Only add to map if new (existing specs are already in the map)
  if (!exists) {
    specs.$jazz.set(key, spec);
  }

  return { created: !exists, updated: exists };
}

/**
 * Upsert options into the catalog (idempotent)
 *
 * Handles all three option types (game, junk, multiplier) in a single unified function.
 * Uses discriminated union based on the `type` field.
 */
async function upsertOptions(
  workerAccount: co.loaded<typeof PlayerAccount>,
  catalog: GameCatalog,
  options: OptionData[],
): Promise<{ created: number; updated: number }> {
  let loadedCatalog = await catalog.$jazz.ensureLoaded({
    resolve: { options: {} },
  });

  // Initialize options map if it doesn't exist
  if (!loadedCatalog.$jazz.has("options")) {
    const group = Group.create(workerAccount);
    group.makePublic();
    const newMap = MapOfOptions.create({}, { owner: group });
    loadedCatalog.$jazz.set("options", newMap);

    // Reload catalog to ensure the new map is properly loaded
    loadedCatalog = await catalog.$jazz.ensureLoaded({
      resolve: { options: {} },
    });
  }

  const optionsMap = loadedCatalog.options;
  if (!optionsMap) {
    throw new Error("Failed to initialize options");
  }

  let created = 0;
  let updated = 0;

  for (const opt of options) {
    const exists = optionsMap.$jazz.has(opt.name);

    // Create the appropriate option type based on discriminator
    if (opt.type === "game") {
      const newOption = GameOption.create(
        {
          name: opt.name,
          disp: opt.disp,
          type: "game",
          version: opt.version,
          valueType: opt.valueType,
          defaultValue: opt.defaultValue,
        },
        { owner: optionsMap.$jazz.owner },
      );

      // Set optional fields
      if (opt.seq !== undefined && typeof opt.seq === "number") {
        newOption.$jazz.set("seq", opt.seq);
      }
      if (opt.teamOnly === true) {
        newOption.$jazz.set("teamOnly", true);
      }

      // Add choices if present (for menu type options)
      if (opt.choices && opt.choices.length > 0) {
        const choicesList = ChoicesList.create([], {
          owner: newOption.$jazz.owner,
        });

        for (const choice of opt.choices) {
          const choiceItem = ChoiceMap.create(
            { name: choice.name, disp: choice.disp },
            { owner: newOption.$jazz.owner },
          );
          choicesList.$jazz.push(choiceItem);
        }

        newOption.$jazz.set("choices", choicesList);
      }

      optionsMap.$jazz.set(opt.name, newOption);
    } else if (opt.type === "junk") {
      const newOption = JunkOption.create(
        {
          name: opt.name,
          disp: opt.disp,
          type: "junk",
          version: opt.version,
          value: opt.value,
        },
        { owner: optionsMap.$jazz.owner },
      );

      // Set optional fields with validation
      if (opt.sub_type && isValidJunkSubType(opt.sub_type)) {
        newOption.$jazz.set("sub_type", opt.sub_type);
      }
      if (opt.seq !== undefined && typeof opt.seq === "number") {
        newOption.$jazz.set("seq", opt.seq);
      }
      if (opt.scope && isValidJunkScope(opt.scope)) {
        newOption.$jazz.set("scope", opt.scope);
      }
      if (opt.icon && typeof opt.icon === "string") {
        newOption.$jazz.set("icon", opt.icon);
      }
      if (opt.show_in && isValidShowIn(opt.show_in)) {
        newOption.$jazz.set("show_in", opt.show_in);
      }
      if (opt.based_on && isValidBasedOn(opt.based_on)) {
        newOption.$jazz.set("based_on", opt.based_on);
      }
      if (opt.limit && typeof opt.limit === "string") {
        newOption.$jazz.set("limit", opt.limit);
      }
      if (opt.calculation && typeof opt.calculation === "string") {
        newOption.$jazz.set("calculation", opt.calculation);
      }
      if (opt.logic && typeof opt.logic === "string") {
        newOption.$jazz.set("logic", opt.logic);
      }
      if (opt.better && isValidBetter(opt.better)) {
        newOption.$jazz.set("better", opt.better);
      }
      if (opt.score_to_par && typeof opt.score_to_par === "string") {
        newOption.$jazz.set("score_to_par", opt.score_to_par);
      }

      optionsMap.$jazz.set(opt.name, newOption);
    } else if (opt.type === "multiplier") {
      // Always create new option - Jazz doesn't reliably persist updates to existing CoValues
      const newOption = MultiplierOption.create(
        {
          name: opt.name,
          disp: opt.disp,
          type: "multiplier",
          version: opt.version,
          ...(opt.value !== undefined ? { value: opt.value } : {}),
        },
        { owner: optionsMap.$jazz.owner },
      );

      // Set optional fields with validation
      if (opt.sub_type && isValidMultiplierSubType(opt.sub_type)) {
        newOption.$jazz.set("sub_type", opt.sub_type);
      }
      if (opt.seq !== undefined && typeof opt.seq === "number") {
        newOption.$jazz.set("seq", opt.seq);
      }
      if (opt.icon && typeof opt.icon === "string") {
        newOption.$jazz.set("icon", opt.icon);
      }
      if (opt.based_on && typeof opt.based_on === "string") {
        newOption.$jazz.set("based_on", opt.based_on);
      }
      if (opt.scope && isValidMultiplierScope(opt.scope)) {
        newOption.$jazz.set("scope", opt.scope);
      }
      if (opt.availability && typeof opt.availability === "string") {
        newOption.$jazz.set("availability", opt.availability);
      }
      if (opt.override !== undefined && typeof opt.override === "boolean") {
        newOption.$jazz.set("override", opt.override);
      }
      if (
        opt.input_value !== undefined &&
        typeof opt.input_value === "boolean"
      ) {
        newOption.$jazz.set("input_value", opt.input_value);
      }
      if (opt.value_from && typeof opt.value_from === "string") {
        newOption.$jazz.set("value_from", opt.value_from);
      }

      optionsMap.$jazz.set(opt.name, newOption);
    }

    if (exists) {
      updated++;
    } else {
      created++;
    }
  }

  return { created, updated };
}

/**
 * Load game specs from seed files (data/seed/)
 *
 * This is the primary source for game specs and options.
 * Match Play consolidation is already done during seed export.
 */
export async function loadGameSpecsFromSeed(): Promise<GameSpecV03[]> {
  const { loadSeedSpecsAsV03 } = await import("../utils/seed-loader");
  const specs = await loadSeedSpecsAsV03();

  console.log(
    "Loaded from seed files:",
    specs.length,
    specs.map((s) => s.disp),
  );

  return specs as GameSpecV03[];
}

/**
 * Merge game specs from seed files and optionally ArangoDB
 *
 * @deprecated Use loadGameSpecsFromSeed() directly. ArangoDB is no longer
 * the source of truth for specs/options - seed files are.
 */
export async function mergeGameSpecSources(
  _arangoConfig?: ArangoConfig,
): Promise<GameSpecV03[]> {
  // Load from seed files only - ArangoDB is no longer used for specs/options
  return loadGameSpecsFromSeed();
}

/**
 * Import player records from ArangoDB into the worker account's catalog, updating existing entries idempotently.
 *
 * Each Arango player is upserted using the GHIN ID when present or `manual_{legacyId}` otherwise as the unique lookup key.
 * Players are created as individual docs owned by the worker's group; existing catalog players are reused and the catalog players map is populated.
 *
 * @param workerAccount - The worker account that will own created player documents
 * @param catalog - The target game catalog to populate or update players in
 * @param arangoConfig - Optional ArangoDB connection configuration; uses the default config when omitted
 * @returns An object with counts: `created` for new players added to the catalog, `updated` for existing players upserted, and `skipped` for players not imported (e.g., missing name or on error)
 */
async function importPlayers(
  workerAccount: co.loaded<typeof PlayerAccount>,
  catalog: GameCatalog,
  arangoConfig?: ArangoConfig,
): Promise<{ created: number; updated: number; skipped: number }> {
  const result = { created: 0, updated: 0, skipped: 0 };

  try {
    const db = createArangoConnection(arangoConfig || defaultConfig);
    const arangoPlayers = await fetchPlayersWithGames(db);

    console.log(`Importing ${arangoPlayers.length} players from ArangoDB...`);

    // Ensure catalog.players map exists
    const loadedCatalog = await catalog.$jazz.ensureLoaded({
      resolve: { players: {} },
    });

    if (!loadedCatalog.$jazz.has("players")) {
      const group = Group.create(workerAccount);
      group.makePublic();
      const newMap = MapOfPlayers.create({}, { owner: group });
      loadedCatalog.$jazz.set("players", newMap);
    }

    const playersMap = loadedCatalog.players;
    if (!playersMap) {
      throw new Error("Failed to initialize players map");
    }

    // Create a group for player ownership
    const loadedWorker = await workerAccount.$jazz.ensureLoaded({
      resolve: { root: true },
    });

    if (!loadedWorker.root) {
      throw new Error("Worker account has no root");
    }

    const group = loadedWorker.root.$jazz.owner;

    for (const arangoPlayer of arangoPlayers) {
      try {
        // Skip if missing name
        if (!arangoPlayer.name) {
          console.warn(
            `Skipping player (missing name): ${JSON.stringify({ _key: arangoPlayer._key })}`,
          );
          result.skipped++;
          continue;
        }

        // Determine lookup key: ghinId for GHIN players, manual_{_key} for manual players
        const ghinId = arangoPlayer.handicap?.id;
        const legacyId = arangoPlayer._key;
        const mapKey = ghinId || `manual_${legacyId}`;

        // Default gender to "M" if missing, with smart detection for female names
        const gender: "M" | "F" = arangoPlayer.gender || "M";

        // Create handicap if available
        let handicap: Handicap | undefined;
        if (arangoPlayer.handicap) {
          const revDate = arangoPlayer.handicap.revDate
            ? new Date(arangoPlayer.handicap.revDate)
            : undefined;

          // Generate display from index if not present in legacy data
          const display = formatHandicapDisplay(
            arangoPlayer.handicap.index,
            arangoPlayer.handicap.display,
          );

          handicap = Handicap.create(
            {
              source: arangoPlayer.handicap.source,
              display,
              value: arangoPlayer.handicap.index,
              revDate,
            },
            { owner: group },
          );
        }

        // Create clubs list if available
        let clubs: ListOfClubs | undefined;
        if (arangoPlayer.clubs && arangoPlayer.clubs.length > 0) {
          const clubsList = ListOfClubs.create([], { owner: group });
          for (const clubData of arangoPlayer.clubs) {
            const club = Club.create(
              {
                name: clubData.name,
                state: clubData.state,
              },
              { owner: group },
            );
            clubsList.$jazz.push(club);
          }
          clubs = clubsList;
        }

        // Upsert player using mapKey (ghinId or manual_{legacyId})
        const player = await Player.upsertUnique({
          value: {
            name: arangoPlayer.name,
            short: arangoPlayer.short || arangoPlayer.name,
            gender,
            ghinId,
            legacyId,
            handicap,
            clubs,
          },
          unique: mapKey,
          owner: group,
        });

        if (!player?.$isLoaded) {
          throw new Error(`Failed to upsert player: ${arangoPlayer.name}`);
        }

        // Check if player existed in map before (for counting)
        const existedBefore = playersMap.$jazz.has(mapKey);

        // Add to catalog.players map for enumeration (idempotent)
        playersMap.$jazz.set(mapKey, player);

        // Count as created or updated based on previous existence
        if (existedBefore) {
          result.updated++;
          // console.log(`Updated player: ${arangoPlayer.name} (${ghinId})`);
        } else {
          result.created++;
          // console.log(`Created player: ${arangoPlayer.name} (${ghinId})`);
        }
      } catch (error) {
        console.error(`Failed to import player ${arangoPlayer.name}:`, error);
        result.skipped++;
      }
    }

    // Note: We count all upserts as "updated" since we can't easily distinguish
    // between create and update in upsertUnique. The important thing is idempotency.
    console.log(
      `Player import complete: ${result.updated} upserted, ${result.skipped} skipped`,
    );
  } catch (error) {
    console.error("Failed to fetch players from ArangoDB:", error);
  }

  return result;
}

/**
 * Import favorites for a player from JSON files to Jazz
 *
 * This function runs in the USER's context (authenticated endpoint), so it can
 * access and modify the user's account.root.favorites without authorization issues.
 *
 * Favorites are read from data/favorites/{legacyPlayerId}.json files that were
 * exported from ArangoDB using scripts/export-favorites.ts
 *
 * @param playerAccount - The player's loaded PlayerAccount (user's account)
 * @param legacyPlayerId - The player's legacy ArangoDB _key
 * @param catalogId - The worker's catalog ID for looking up players/courses
 * @param workerAccount - The worker account for importing courses from GHIN if needed
 * @returns Object with counts of imported favorites
 */
export async function importFavoritesForPlayer(
  playerAccount: co.loaded<typeof PlayerAccount>,
  legacyPlayerId: string,
  catalogId: string,
  workerAccount: co.loaded<typeof PlayerAccount>,
): Promise<{
  favoritePlayers: number;
  favoriteCourseTees: number;
  errors: string[];
}> {
  console.log(
    `[importFavoritesForPlayer] START for legacyPlayerId: ${legacyPlayerId}`,
  );
  console.log(
    `[importFavoritesForPlayer] Running in user context: ${playerAccount.$jazz.id}`,
  );
  console.log(`[importFavoritesForPlayer] Using catalog: ${catalogId}`);

  const result = {
    favoritePlayers: 0,
    favoriteCourseTees: 0,
    errors: [] as string[],
  };

  try {
    // Load favorites from JSON file instead of ArangoDB
    const { loadPlayerFavorites } = await import("../utils/favorites-file");
    console.log(`[importFavoritesForPlayer] Loading favorites from file...`);
    const playerFavoritesData = await loadPlayerFavorites(legacyPlayerId);

    if (!playerFavoritesData) {
      console.log(
        `[importFavoritesForPlayer] No favorites file found for player ${legacyPlayerId}`,
      );
      return result;
    }

    console.log(
      `[importFavoritesForPlayer] Loaded favorites: ${playerFavoritesData.favoritePlayers.length} players, ${playerFavoritesData.favoriteCourseTees.length} course/tees`,
    );

    console.log(`[importFavoritesForPlayer] Loading catalog by ID...`);
    const { GameCatalog } = await import("spicylib/schema");
    const catalog = await GameCatalog.load(catalogId, {
      resolve: { players: {}, courses: {} },
    });

    if (!catalog?.$isLoaded) {
      result.errors.push("Failed to load catalog");
      return result;
    }
    console.log(`[importFavoritesForPlayer] Catalog loaded successfully`);

    console.log(`[importFavoritesForPlayer] Checking player account root...`);
    // Player account should already be loaded with root from the calling context
    if (!playerAccount.root?.$isLoaded) {
      console.error(
        `[importFavoritesForPlayer] Player account root not loaded!`,
      );
      result.errors.push("Player account root not loaded");
      return result;
    }

    console.log(`[importFavoritesForPlayer] Player account root is loaded`);
    const root = playerAccount.root;
    const { Favorites } = await import("spicylib/schema");

    // Load or create favorites object (idempotent)
    let favorites: co.loaded<typeof Favorites>;
    if (root.$jazz.has("favorites") && root.favorites) {
      console.log(
        `[importFavoritesForPlayer] Loading existing favorites object...`,
      );
      const loadedRoot = await root.$jazz.ensureLoaded({
        resolve: { favorites: { players: {}, courseTees: {} } },
      });
      if (loadedRoot.favorites?.$isLoaded) {
        favorites = loadedRoot.favorites;
        console.log(
          `[importFavoritesForPlayer] Existing favorites loaded (isLoaded: ${favorites.$isLoaded}, players: ${favorites.players?.$isLoaded}, courseTees: ${favorites.courseTees?.$isLoaded})`,
        );
      } else {
        throw new Error("Failed to load existing favorites");
      }
    } else {
      console.log(
        `[importFavoritesForPlayer] Creating new favorites object...`,
      );
      const group = root.$jazz.owner as Group;
      favorites = Favorites.create({}, { owner: group });
      root.$jazz.set("favorites", favorites);
      console.log(
        `[importFavoritesForPlayer] New favorites created (isLoaded: ${favorites.$isLoaded})`,
      );
    }

    // Import favorite players from file data
    const playerFavorites = playerFavoritesData.favoritePlayers;
    console.log(
      `Found ${playerFavorites.length} favorite players for legacy player ${legacyPlayerId}`,
    );

    if (playerFavorites.length > 0) {
      // Load catalog players map
      const loadedCatalog = await catalog.$jazz.ensureLoaded({
        resolve: { players: {} },
      });

      if (!loadedCatalog.players) {
        result.errors.push("Catalog players not loaded");
        return result;
      }

      const catalogPlayers = loadedCatalog.players;

      // Debug: Log first few catalog player keys
      const catalogKeys: string[] = [];
      for (const key in catalogPlayers) {
        catalogKeys.push(key);
        if (catalogKeys.length >= 10) break;
      }
      console.log(
        `[DEBUG] Sample catalog player keys: ${catalogKeys.join(", ")}`,
      );

      // Initialize favorites.players list if not present
      if (!favorites.$jazz.has("players")) {
        const { ListOfFavoritePlayers } = await import("spicylib/schema");
        const group = favorites.$jazz.owner as Group;
        favorites.$jazz.set(
          "players",
          ListOfFavoritePlayers.create([], { owner: group }),
        );
      }

      const favoritePlayersList = favorites.players;
      if (!favoritePlayersList) {
        result.errors.push("Failed to initialize favorite players list");
        return result;
      }
      console.log(
        `[importFavoritesForPlayer] Favorite players list ready (loaded: ${favoritePlayersList.$isLoaded})`,
      );

      // GHIN IDs are pre-resolved in the exported JSON files
      // No need to query ArangoDB anymore

      // Load all existing favorites with their player references to check for duplicates
      const existingPlayerIds = new Set<string>();
      const existingPlayerGhinIds = new Set<string>();
      if (favoritePlayersList?.$isLoaded && favoritePlayersList.length > 0) {
        await favoritePlayersList.$jazz.ensureLoaded({
          resolve: { $each: { player: true } },
        });

        for (let i = 0; i < favoritePlayersList.length; i++) {
          const favPlayer = favoritePlayersList[i];
          if (favPlayer?.$isLoaded && favPlayer.player?.$isLoaded) {
            existingPlayerIds.add(favPlayer.player.$jazz.id);
            if (favPlayer.player.ghinId) {
              existingPlayerGhinIds.add(favPlayer.player.ghinId);
            }
            if (favPlayer.player.legacyId) {
              existingPlayerGhinIds.add(`manual_${favPlayer.player.legacyId}`);
            }
          }
        }
      }

      console.log(
        `[importFavoritesForPlayer] Found ${existingPlayerIds.size} existing favorite players before import`,
      );

      for (const fav of playerFavorites) {
        // ghinId is pre-resolved in the exported JSON file
        const ghinId = fav.ghinId;

        // Try to find player in catalog - first by GHIN ID, then by manual_{legacyId}
        let player = null;

        if (ghinId && catalogPlayers.$jazz.has(ghinId)) {
          player = catalogPlayers[ghinId];
        } else {
          // Try manual key
          const manualKey = `manual_${fav.favoritePlayerKey}`;
          if (catalogPlayers.$jazz.has(manualKey)) {
            player = catalogPlayers[manualKey];
          }
        }

        if (!player) {
          console.log(
            `[DEBUG] Failed to find player - ghinId: ${ghinId}, manualKey: manual_${fav.favoritePlayerKey}, favoritePlayerKey: ${fav.favoritePlayerKey}`,
          );
          result.errors.push(
            `Favorite player not found in catalog: ${ghinId || `manual_${fav.favoritePlayerKey}`}`,
          );
          continue;
        }

        // Skip if already in favorites (check by both Jazz ID and GHIN ID for idempotency)
        const playerId = player.$isLoaded
          ? player.$jazz.id
          : (player as { $jazz?: { id: string } })?.$jazz?.id;

        // Check by Jazz ID
        if (playerId && existingPlayerIds.has(playerId)) {
          console.log(
            `[importFavoritesForPlayer] Skipping duplicate player (Jazz ID): ${playerId}`,
          );
          continue;
        }

        // Check by GHIN ID or legacy ID
        const playerManualKey = `manual_${fav.favoritePlayerKey}`;
        if (
          (ghinId && existingPlayerGhinIds.has(ghinId)) ||
          existingPlayerGhinIds.has(playerManualKey)
        ) {
          console.log(
            `[importFavoritesForPlayer] Skipping duplicate player (GHIN/Legacy ID): ${ghinId || playerManualKey}`,
          );
          continue;
        }

        // Add to tracking sets to prevent duplicates within this same import run
        if (playerId) {
          existingPlayerIds.add(playerId);
        }
        if (ghinId) {
          existingPlayerGhinIds.add(ghinId);
        } else {
          existingPlayerGhinIds.add(playerManualKey);
        }

        const { FavoritePlayer } = await import("spicylib/schema");
        const addedAt = fav.addedAt ? new Date(fav.addedAt) : new Date();
        const favPlayer = FavoritePlayer.create(
          {
            player: player as co.loaded<typeof Player>,
            addedAt,
          },
          { owner: favorites.$jazz.owner },
        );

        if (favoritePlayersList?.$isLoaded) {
          favoritePlayersList.$jazz.push(favPlayer);
        }
        result.favoritePlayers++;
      }
    }

    // Import favorite course/tees from file data
    const courseTeesFavorites = playerFavoritesData.favoriteCourseTees;
    console.log(
      `Found ${courseTeesFavorites.length} favorite course/tees for legacy player ${legacyPlayerId}`,
    );

    if (courseTeesFavorites.length > 0) {
      // Load catalog courses
      const loadedCatalog = await catalog.$jazz.ensureLoaded({
        resolve: { courses: {} },
      });

      if (!loadedCatalog.courses) {
        result.errors.push("Catalog courses not loaded");
        return result;
      }

      const catalogCourses = loadedCatalog.courses;

      // Initialize favorites.courseTees list if not present
      if (!favorites.$jazz.has("courseTees")) {
        const { ListOfCourseTees } = await import("spicylib/schema");
        const group = favorites.$jazz.owner as Group;
        favorites.$jazz.set(
          "courseTees",
          ListOfCourseTees.create([], { owner: group }),
        );
      }

      const courseTeesList = favorites.courseTees;
      if (!courseTeesList) {
        result.errors.push("Failed to initialize course tees list");
        return result;
      }
      console.log(
        `[importFavoritesForPlayer] Favorite course/tees list ready (loaded: ${courseTeesList.$isLoaded})`,
      );

      // Ensure all existing course/tee items are loaded with their course and tee references
      if (courseTeesList?.$isLoaded && courseTeesList.length > 0) {
        await courseTeesList.$jazz.ensureLoaded({
          resolve: { $each: { course: {}, tee: {} } },
        });
      }

      // Check for duplicate course/tee combinations based on GHIN IDs
      const existingCourseTees = new Set<string>();
      if (courseTeesList?.$isLoaded) {
        for (let i = 0; i < courseTeesList.length; i++) {
          const ct = courseTeesList[i];
          if (ct?.$isLoaded && ct.course?.$isLoaded && ct.tee?.$isLoaded) {
            // Use course.id (GHIN courseId) and tee.id (GHIN teeSetRatingId) for duplicate check
            const key = `${ct.course.id}-${ct.tee.id}`;
            existingCourseTees.add(key);
            console.log(`[DEBUG] Found existing favorite: ${key}`);
          }
        }
      }
      console.log(
        `[DEBUG] Starting with ${existingCourseTees.size} existing course/tee favorites`,
      );

      const { Course } = await import("spicylib/schema");

      // Debug: Log first few catalog course keys
      const catalogCourseKeys: string[] = [];
      for (const key in catalogCourses) {
        catalogCourseKeys.push(key);
        if (catalogCourseKeys.length >= 10) break;
      }
      console.log(
        `[DEBUG] Sample catalog course keys: ${catalogCourseKeys.join(", ")}`,
      );

      // Add favorite course/tees to the list
      for (const fav of courseTeesFavorites) {
        // Find course in catalog by courseId
        const courseKey = String(fav.courseId);

        console.log(
          `[DEBUG] Looking for course ${courseKey}, tee ${fav.teeId}`,
        );

        // Access course directly from map
        let courseRef = catalogCourses[courseKey];

        if (!courseRef) {
          console.log(
            `[DEBUG] Course ${courseKey} not found in catalog, attempting to import from GHIN...`,
          );
          // Try to import from GHIN
          const imported = await importCourseFromGhin(
            Number(fav.courseId),
            catalogCourses,
            workerAccount,
          );
          if (imported) {
            courseRef = imported;
          } else {
            console.log(
              `[DEBUG] Failed to import course ${courseKey} from GHIN, skipping`,
            );
            continue;
          }
        }

        // Load course to access its tees list and find the matching tee
        const course = courseRef.$isLoaded
          ? courseRef
          : await Course.load(courseRef.$jazz.id, { resolve: { tees: {} } });

        if (!course?.$isLoaded) {
          result.errors.push(`Favorite course failed to load: ${courseKey}`);
          continue;
        }

        // Ensure tees list is loaded
        if (!course.tees?.$isLoaded) {
          result.errors.push(`Course tees not loaded: ${courseKey}`);
          continue;
        }

        // Find the tee by teeId - the tee might not be loaded but we can check the reference
        let teeRef = null;
        for (let i = 0; i < course.tees.length; i++) {
          const t = course.tees[i];
          if (t?.$isLoaded && t.id === fav.teeId) {
            teeRef = t;
            break;
          }
        }

        // If tee exists but doesn't have status field, set it to "active"
        // (tees from catalog are active since getCourseDetails only returns active tees)
        if (teeRef && !teeRef.status) {
          teeRef.$jazz.set("status", "active");
          console.log(
            `[DEBUG] Updated tee ${fav.teeId} status to "active" (was missing)`,
          );
        }

        if (!teeRef) {
          console.log(
            `[DEBUG] Tee ${fav.teeId} not found on course ${courseKey}, attempting to import from GHIN...`,
          );
          // Try to import from GHIN (includes inactive tees)
          const imported = await importTeeFromGhin(
            Number(fav.teeId),
            course,
            workerAccount,
          );
          if (imported) {
            teeRef = imported;
          } else {
            console.log(
              `[DEBUG] Failed to import tee ${fav.teeId} from GHIN, skipping`,
            );
            continue;
          }
        }

        // Get IDs for duplicate check using GHIN IDs
        const courseId = course.id; // GHIN courseId
        const teeId = teeRef.id; // GHIN teeSetRatingId
        const key = `${courseId}-${teeId}`;

        if (existingCourseTees.has(key)) {
          console.log(
            `[DEBUG] Skipping duplicate course/tee: ${courseId}-${teeId}`,
          );
          continue;
        }

        // Add to set so we don't add it again in this same import
        existingCourseTees.add(key);
        console.log(`[DEBUG] Adding new favorite: ${key}`);

        const { CourseTee } = await import("spicylib/schema");
        const addedAt = fav.addedAt ? new Date(fav.addedAt) : new Date();
        const courseTee = CourseTee.create(
          {
            course: course as co.loaded<typeof Course>,
            tee: teeRef as co.loaded<typeof Tee>,
            addedAt,
          },
          { owner: favorites.$jazz.owner },
        );

        if (courseTeesList?.$isLoaded) {
          courseTeesList.$jazz.push(courseTee);
        }
        result.favoriteCourseTees++;
      }
    }

    console.log(
      `Favorites import complete for ${legacyPlayerId}: ${result.favoritePlayers} players, ${result.favoriteCourseTees} course/tees`,
    );

    if (result.errors.length > 0) {
      console.warn(
        `Favorites import had ${result.errors.length} errors:`,
        result.errors,
      );
    }
  } catch (error) {
    console.error("Failed to import favorites (exception):", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(errorMsg);
  }

  return result;
}

/**
 * Import options for catalog import
 */
export interface CatalogImportOptions {
  specs?: boolean;
  players?: boolean;
}

/**
 * Import all game specs to the catalog (idempotent)
 */
export async function importGameSpecsToCatalog(
  workerAccount: co.loaded<typeof PlayerAccount>,
  arangoConfig?: ArangoConfig,
  options?: CatalogImportOptions,
): Promise<ImportResult> {
  const importSpecs = options?.specs ?? true;
  const importPlayersFlag = options?.players ?? true;

  console.log(
    `Starting import to catalog for worker: ${workerAccount.$jazz.id} (specs: ${importSpecs}, players: ${importPlayersFlag})`,
  );

  const catalog = await loadOrCreateCatalog(workerAccount);
  console.log("Catalog loaded/created:", catalog.$jazz.id);

  const allSpecs = await mergeGameSpecSources(arangoConfig);
  console.log("Total specs to import:", allSpecs.length);

  const result: ImportResult = {
    specs: {
      created: 0,
      updated: 0,
      skipped: 0,
    },
    options: {
      created: 0,
      updated: 0,
    },
    players: {
      created: 0,
      updated: 0,
      skipped: 0,
    },
    errors: [],
  };

  // Collect all unique options across all specs
  const allOptions = new Map<string, OptionData>();

  // First pass: Validate specs and collect options
  const validSpecs: GameSpecV03[] = [];

  for (const spec of allSpecs) {
    try {
      // Validate all required fields before creating GameSpec
      if (!spec.disp || !spec.version || !spec.type || !spec.status) {
        result.specs.skipped++;
        result.errors.push({
          item: `spec:${spec.name || spec._key || "unknown"}`,
          error: "Missing required fields (disp, version, type, or status)",
        });
        continue;
      }

      // Validate numeric fields
      if (typeof spec.min_players !== "number" || spec.min_players < 1) {
        result.specs.skipped++;
        result.errors.push({
          item: `spec:${spec.name || spec._key || "unknown"}`,
          error: "Invalid min_players: must be a number >= 1",
        });
        continue;
      }

      // Validate location_type
      if (!spec.location_type || typeof spec.location_type !== "string") {
        result.specs.skipped++;
        result.errors.push({
          item: `spec:${spec.name || spec._key || "unknown"}`,
          error: "Invalid location_type: must be a non-empty string",
        });
        continue;
      }

      validSpecs.push(spec);

      // Use transform layer to get properly typed options
      const transformed = transformGameSpec(spec);
      if (transformed.options && transformed.options.length > 0) {
        for (const opt of transformed.options) {
          if (!allOptions.has(opt.name)) {
            if (opt.type === "game") {
              allOptions.set(opt.name, {
                type: "game",
                name: opt.name,
                disp: opt.disp,
                version: String(spec.version),
                valueType: opt.valueType,
                defaultValue: opt.defaultValue,
                choices: opt.choices,
                teamOnly: opt.teamOnly,
              });
            } else if (opt.type === "junk") {
              // For junk and multiplier options, we still need the full v0.3 data
              // since the transform layer only preserves basic fields
              const junkData = spec.junk?.find((j) => j.name === opt.name);
              if (junkData) {
                allOptions.set(opt.name, {
                  type: "junk",
                  name: opt.name,
                  disp: opt.disp,
                  version: String(spec.version),
                  sub_type: junkData.type as string | undefined,
                  value: opt.value,
                  seq: junkData.seq as number | undefined,
                  scope: junkData.scope as string | undefined,
                  icon: junkData.icon as string | undefined,
                  show_in: junkData.show_in as string | undefined,
                  based_on: junkData.based_on as string | undefined,
                  limit: junkData.limit as string | undefined,
                  calculation: junkData.calculation as string | undefined,
                  logic: junkData.logic as string | undefined,
                  better: junkData.better as string | undefined,
                  score_to_par: junkData.score_to_par as string | undefined,
                });
              }
            } else if (opt.type === "multiplier") {
              const multData = spec.multipliers?.find(
                (m) => m.name === opt.name,
              );
              if (multData) {
                allOptions.set(opt.name, {
                  type: "multiplier",
                  name: opt.name,
                  disp: opt.disp,
                  version: String(spec.version),
                  sub_type: multData.sub_type as string | undefined,
                  value: opt.value,
                  seq: multData.seq as number | undefined,
                  icon: multData.icon as string | undefined,
                  based_on: multData.based_on as string | undefined,
                  scope: multData.scope as string | undefined,
                  availability: multData.availability as string | undefined,
                  override: multData.override as boolean | undefined,
                  input_value: multData.input_value as boolean | undefined,
                  value_from: multData.value_from as string | undefined,
                });
              }
            }
          }
        }
      }
    } catch (error) {
      result.errors.push({
        item: `spec:${spec.disp || spec.name || spec._key || "unknown"}`,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Second pass: Import all collected options (only if importing specs)
  if (importSpecs) {
    console.log(`Importing ${allOptions.size} total options...`);
    try {
      const optionsResult = await upsertOptions(
        workerAccount,
        catalog,
        Array.from(allOptions.values()),
      );
      result.options = optionsResult;
    } catch (error) {
      result.errors.push({
        item: "options:all",
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Third pass: Import specs with references to catalog options
    const loadedCatalog = await catalog.$jazz.ensureLoaded({
      resolve: { options: {} },
    });

    console.log(
      `Importing ${validSpecs.length} specs with option references...`,
    );
    for (const spec of validSpecs) {
      try {
        const { created, updated } = await upsertGameSpec(
          catalog,
          spec,
          loadedCatalog.options || undefined,
        );

        if (created) {
          result.specs.created++;
        } else if (updated) {
          result.specs.updated++;
        } else {
          result.specs.skipped++;
        }
      } catch (error) {
        result.errors.push({
          item: `spec:${spec.disp || spec.name || spec._key || "unknown"}`,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  } else {
    console.log("Skipping specs import (disabled)");
  }

  // Fourth pass: Import players (only if enabled)
  if (importPlayersFlag) {
    console.log("Importing players...");
    try {
      const playersResult = await importPlayers(
        workerAccount,
        catalog,
        arangoConfig,
      );
      result.players = playersResult;
    } catch (error) {
      result.errors.push({
        item: "players:all",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  } else {
    console.log("Skipping players import (disabled)");
  }

  return result;
}

/**
 * Game Import Result Interface
 */
export interface GameImportResult {
  games: { created: number; updated: number; skipped: number; failed: number };
  courses: { created: number; updated: number; skipped: number };
  tees: { created: number; updated: number; skipped: number };
  rounds: { created: number; updated: number; skipped: number };
  errors: Array<{ gameId: string; error: string }>;
}

/**
 * Import a course from GHIN API by ID (temporary helper for favorites import)
 */
async function importCourseFromGhin(
  courseId: number,
  coursesMap: MapOfCourses,
  workerAccount: co.loaded<typeof PlayerAccount>,
): Promise<co.loaded<typeof Course> | null> {
  try {
    const { getCourseDetails } = await import("../courses");
    const courseData = await getCourseDetails({ course_id: courseId });

    const courseKey = String(courseData.CourseId);
    const group = Group.create(workerAccount);
    group.makePublic();

    const newCourse = Course.create(
      {
        id: String(courseData.CourseId),
        status: courseData.CourseStatus.toLowerCase(),
        name: courseData.CourseName,
        city: courseData.CourseCity || "",
        state: courseData.CourseState || "",
        season: { all_year: true },
        default_tee: CourseDefaultTee.create({}, { owner: group }),
        tees: ListOfTees.create([], { owner: group }),
      },
      { owner: group },
    );

    coursesMap.$jazz.set(courseKey, newCourse);
    console.log(
      `Imported course ${courseData.CourseName} (${courseId}) from GHIN with status: ${courseData.CourseStatus}`,
    );
    return newCourse;
  } catch (error) {
    console.error(`Failed to import course ${courseId} from GHIN:`, error);
    return null;
  }
}

/**
 * Import a tee from GHIN API by teeSetRatingId and add it to a course
 */
async function importTeeFromGhin(
  teeSetRatingId: number,
  course: co.loaded<typeof Course>,
  _workerAccount: co.loaded<typeof PlayerAccount>,
): Promise<co.loaded<typeof Tee> | null> {
  try {
    const { GHIN_USERNAME, GHIN_PASSWORD, GHIN_BASE_URL } = process.env;
    if (!GHIN_USERNAME || !GHIN_PASSWORD) {
      throw new Error("GHIN credentials not configured");
    }

    const { GhinClient } = await import("@spicygolf/ghin");
    const ghinClient = new GhinClient({
      username: GHIN_USERNAME,
      password: GHIN_PASSWORD,
      apiAccess: true,
      baseUrl: GHIN_BASE_URL,
    });

    const teeData = await ghinClient.courses.getTeeSetRating({
      tee_set_rating_id: teeSetRatingId,
      include_altered_tees: true,
    });

    console.log(
      `[importTeeFromGhin] GHIN API returned TeeSetStatus: ${teeData.TeeSetStatus} for tee ${teeSetRatingId}`,
    );

    // Ensure the course tees list is loaded
    if (!course.tees?.$isLoaded) {
      await course.$jazz.ensureLoaded({ resolve: { tees: {} } });
    }

    if (!course.tees) {
      console.error(`Course ${course.id} has no tees list`);
      return null;
    }

    // Check if tee already exists (idempotent)
    const teeIdString = String(teeSetRatingId);
    if (course.tees?.$isLoaded) {
      for (let i = 0; i < course.tees.length; i++) {
        const existingTee = course.tees[i];
        if (existingTee?.$isLoaded && existingTee.id === teeIdString) {
          console.log(
            `Tee ${teeIdString} already exists in course ${course.name}, updating status if needed`,
          );
          console.log(
            `[DEBUG] Existing tee status: ${existingTee.status}, GHIN TeeSetStatus: ${teeData.TeeSetStatus}`,
          );
          // Update status if it's different
          if (
            teeData.TeeSetStatus &&
            existingTee.status !== teeData.TeeSetStatus
          ) {
            existingTee.$jazz.set("status", teeData.TeeSetStatus);
            console.log(
              `Updated tee ${teeIdString} status to ${teeData.TeeSetStatus}`,
            );
          } else if (!teeData.TeeSetStatus) {
            console.log(
              `[WARNING] GHIN API did not return TeeSetStatus for tee ${teeIdString}`,
            );
          }
          return existingTee;
        }
      }
    }

    // Create the tee with holes
    const group = course.$jazz.owner as Group;
    const { Tee, TeeHole, ListOfTeeHoles } = await import("spicylib/schema");

    const teeHolesList = ListOfTeeHoles.create([], { owner: group });
    for (const holeData of teeData.Holes) {
      const teeHole = TeeHole.create(
        {
          id: String(holeData.HoleId),
          number: holeData.Number,
          par: holeData.Par,
          yards: holeData.Length,
          meters: Math.round(holeData.Length * 0.9144),
          handicap: holeData.Allocation,
        },
        { owner: group },
      );
      teeHolesList.$jazz.push(teeHole);
    }

    // Find the ratings
    const totalRating = teeData.Ratings.find(
      (r: { RatingType: string }) => r.RatingType === "Total",
    );
    const frontRating = teeData.Ratings.find(
      (r: { RatingType: string }) => r.RatingType === "Front",
    );
    const backRating = teeData.Ratings.find(
      (r: { RatingType: string }) => r.RatingType === "Back",
    );

    if (!totalRating) {
      console.error(`No Total rating found for tee ${teeSetRatingId}`);
      return null;
    }

    // Map gender from GHIN format to our schema format
    let gender: "M" | "F" | "Mixed" = "M";
    if (teeData.Gender === "Female") {
      gender = "F";
    } else if (teeData.Gender === "Mixed") {
      gender = "Mixed";
    }

    const newTee = Tee.create(
      {
        id: String(teeSetRatingId),
        name: teeData.TeeSetRatingName,
        gender,
        status: teeData.TeeSetStatus,
        holes: teeHolesList,
        holesCount: teeData.HolesNumber,
        totalYardage: teeData.TotalYardage,
        totalMeters: teeData.TotalMeters,
        ratings: {
          total: {
            rating: totalRating.CourseRating,
            slope: totalRating.SlopeRating,
            bogey: totalRating.BogeyRating,
          },
          front: frontRating
            ? {
                rating: frontRating.CourseRating,
                slope: frontRating.SlopeRating,
                bogey: frontRating.BogeyRating,
              }
            : {
                rating: 0,
                slope: 0,
                bogey: 0,
              },
          back: backRating
            ? {
                rating: backRating.CourseRating,
                slope: backRating.SlopeRating,
                bogey: backRating.BogeyRating,
              }
            : {
                rating: 0,
                slope: 0,
                bogey: 0,
              },
        },
      },
      { owner: group },
    );

    if (course.tees?.$isLoaded) {
      course.tees.$jazz.push(newTee);
    }
    console.log(
      `Imported tee ${teeData.TeeSetRatingName} (${teeSetRatingId}) from GHIN for course ${course.name}`,
    );
    return newTee;
  } catch (error) {
    console.error(`Failed to import tee ${teeSetRatingId} from GHIN:`, error);
    return null;
  }
}

/**
 * Upsert a course and tee into the catalog (idempotent)
 *
 * @param coursesMap - The already-loaded courses map from catalog
 * @param courseData - Course metadata from ArangoDB
 * @param teeData - Tee data from ArangoDB round
 * @param workerAccount - Worker account for creating groups
 * @param courseCache - Cache of loaded courses to avoid repeated Course.load calls
 * @returns Object with courseId and teeId strings
 */
async function upsertCourse(
  coursesMap: MapOfCourses,
  courseData: {
    course_id: string;
    course_name: string;
    course_city?: string;
    course_state?: string;
  },
  teeData: {
    tee_id: string;
    name: string;
    TotalYardage: number;
    holes: Array<{
      hole: string;
      par: number;
      length: number;
      handicap: number;
    }>;
    Ratings: ArangoTeeRating[];
  },
  workerAccount: co.loaded<typeof PlayerAccount>,
  courseCache: Map<string, co.loaded<typeof Course>>,
  teeCache: Map<string, co.loaded<typeof Tee>>,
): Promise<{
  course: co.loaded<typeof Course>;
  tee: co.loaded<typeof Tee>;
  courseCreated: boolean;
  teeCreated: boolean;
} | null> {
  const courseKey = String(courseData.course_id);
  const teeKey = teeData.tee_id;
  let courseCreated = false;

  // Check if course exists, create if not
  if (!coursesMap.$jazz.has(courseKey)) {
    courseCreated = true;
    const group = Group.create(workerAccount);
    group.makePublic();

    const newCourse = Course.create(
      {
        id: courseData.course_id,
        status: "active",
        name: courseData.course_name,
        city: courseData.course_city || "",
        state: courseData.course_state || "",
        season: { all_year: true },
        default_tee: CourseDefaultTee.create({}, { owner: group }),
        tees: ListOfTees.create([], { owner: group }),
      },
      { owner: group },
    );

    coursesMap.$jazz.set(courseKey, newCourse);
    // Add newly created course to cache immediately (it's already loaded since we just created it)
    courseCache.set(courseKey, newCourse as co.loaded<typeof Course>);
  }

  // Get course from cache, or load it if not cached
  let loadedCourse = courseCache.get(courseKey);
  if (!loadedCourse) {
    // Course exists in map but not in our cache - load it
    const courseRef = coursesMap[courseKey];
    if (!courseRef) {
      console.warn(`Course ${courseKey} not found in map`);
      return null;
    }

    // Load the course with its tees
    // courseRef may be a MaybeLoaded reference - get its ID and load it properly
    const courseId = courseRef.$jazz.id;
    const loaded = await Course.load(courseId, {
      resolve: { tees: true },
    });

    if (!loaded || !loaded.$isLoaded) {
      console.warn(`Failed to load course ${courseKey} (id: ${courseId})`);
      return null;
    }

    loadedCourse = loaded;
    courseCache.set(courseKey, loadedCourse);
  }

  // tees is now loaded via resolve - safe to access
  const teesList = loadedCourse.tees as ListOfTees;

  // Check if tee exists on course
  let existingTee: co.loaded<typeof Tee> | null = null;
  let teeCreated = false;

  // First check tee cache
  if (teeCache.has(teeKey)) {
    existingTee = teeCache.get(teeKey) || null;
  } else {
    // Search in tees list
    for (let i = 0; i < teesList.length; i++) {
      const tee = teesList[i];
      if (tee?.$isLoaded && tee.id === teeKey) {
        existingTee = tee as co.loaded<typeof Tee>;
        teeCache.set(teeKey, existingTee);
        break;
      }
    }
  }

  // If tee exists but doesn't have status field, set it to "active"
  if (existingTee && !existingTee.status) {
    existingTee.$jazz.set("status", "active");
  }

  // Create tee if it doesn't exist
  if (!existingTee) {
    teeCreated = true;
    const group = loadedCourse.$jazz.owner as Group;

    // Create tee holes
    const holesList = ListOfTeeHoles.create([], { owner: group });

    for (const holeData of teeData.holes) {
      const holeNumber = Number.parseInt(holeData.hole, 10);
      const teeHole = TeeHole.create(
        {
          id: `${teeKey}-${holeData.hole}`,
          number: holeNumber,
          par: holeData.par,
          yards: holeData.length,
          meters: Math.round(holeData.length * 0.9144),
          handicap: holeData.handicap,
        },
        { owner: group },
      );
      holesList.$jazz.push(teeHole);
    }

    // Determine gender from tee name
    const teeName = teeData.name.toLowerCase();
    let gender: "M" | "F" | "Mixed" = "Mixed";
    if (teeName.includes("men") && !teeName.includes("women")) {
      gender = "M";
    } else if (teeName.includes("women") || teeName.includes("ladies")) {
      gender = "F";
    }

    // Convert ArangoDB ratings array format to Jazz schema format
    const ratings = convertArangoRatings(teeData.Ratings);

    const newTee = Tee.create(
      {
        id: teeKey,
        name: teeData.name,
        gender,
        status: "active",
        holes: holesList,
        holesCount: teeData.holes.length,
        totalYardage: teeData.TotalYardage,
        totalMeters: Math.round(teeData.TotalYardage * 0.9144),
        ratings,
      },
      { owner: group },
    );

    teesList.$jazz.push(newTee);
    existingTee = newTee as co.loaded<typeof Tee>;
    teeCache.set(teeKey, existingTee);
  } else {
    // Tee exists - check if ratings need to be updated (were imported with zeros)
    const currentSlope = existingTee.ratings?.total?.slope ?? 0;
    const newRatings = convertArangoRatings(teeData.Ratings);
    const newSlope = newRatings.total.slope;

    if (currentSlope === 0 && newSlope > 0) {
      // Update tee with correct ratings from ArangoDB
      existingTee.$jazz.set("ratings", newRatings);
    }
  }

  return { course: loadedCourse, tee: existingTee, courseCreated, teeCreated };
}

/**
 * Upsert a Round from ArangoDB round data (idempotent)
 *
 * Uses legacyId as the unique key for upsert. Also adds the round to the
 * player's rounds list if not already present.
 *
 * @param roundData - Round data from ArangoDB
 * @param edgeData - RoundToGame edge data with handicap info
 * @param player - Player object to add round to
 * @param course - Embedded Course object
 * @param tee - Embedded Tee object
 * @param group - Jazz group to own the round
 * @returns Upserted Round
 */
async function upsertRound(
  roundData: RoundV03,
  edgeData: RoundToGameEdgeV03,
  player: co.loaded<typeof Player>,
  course: co.loaded<typeof Course>,
  tee: co.loaded<typeof Tee>,
  group: Group,
): Promise<Round> {
  const legacyId = roundData._key;
  const playerId = player.$jazz.id;

  // Create scores map with new flat structure (1-indexed: "1"-"18")
  const scoresMap = RoundScores.create({}, { owner: group });

  for (const scoreData of roundData.scores) {
    const holeNumber = scoreData.hole; // Use as-is: "1"-"18" (1-indexed)

    // Create HoleScores record for this hole
    // Filter out 'pops' - we calculate them dynamically based on handicaps and hole handicap.
    // Storing pops led to stale/incorrect data when handicaps changed. Dynamic calculation
    // ensures pops are always correct and handles "low" vs "full" handicap modes properly.
    const holeScoresData: Record<string, string> = {};
    for (const val of scoreData.values) {
      if (val.k !== "pops") {
        holeScoresData[val.k] = val.v;
      }
    }

    const holeScores = HoleScores.create(holeScoresData, { owner: group });
    scoresMap.$jazz.set(holeNumber, holeScores);
  }

  // Note: We skip history creation for imports as historical timestamps wouldn't be accurate

  // Upsert round using legacyId as unique key
  const round = await Round.upsertUnique({
    unique: legacyId,
    value: {
      createdAt: new Date(roundData.date),
      playerId,
      handicapIndex: edgeData.handicap_index,
      scores: scoresMap,
      legacyId,
      course,
      tee,
    },
    owner: group,
  });

  if (!round || !round.$isLoaded) {
    throw new Error(`Failed to upsert round: ${legacyId}`);
  }

  // Add round to player.rounds if not already present
  // First ensure player has a rounds list
  if (!player.$jazz.has("rounds")) {
    player.$jazz.set("rounds", ListOfRounds.create([], { owner: group }));
  }

  // Load player with rounds to check for duplicates
  const loadedPlayer = await player.$jazz.ensureLoaded({
    resolve: { rounds: true },
  });

  const playerRounds = loadedPlayer.rounds;
  if (playerRounds) {
    // Check if round is already in player's rounds list by legacyId
    let roundExists = false;
    for (let i = 0; i < playerRounds.length; i++) {
      const existingRound = playerRounds[i];
      if (existingRound?.$isLoaded && existingRound.legacyId === legacyId) {
        roundExists = true;
        break;
      }
    }

    if (!roundExists) {
      playerRounds.$jazz.push(round);
    }
  }

  return round as Round;
}

/**
 * Import a single game from ArangoDB into the catalog (idempotent)
 *
 * @param workerAccount - Worker account
 * @param catalog - Game catalog
 * @param gameData - Game data with rounds from ArangoDB
 * @param db - ArangoDB database connection
 * @returns Result object with success status and optional error
 */
// Type for the pre-loaded catalog with all maps available
type LoadedCatalog = co.loaded<typeof GameCatalog>;

async function importGame(
  workerAccount: co.loaded<typeof PlayerAccount>,
  loadedCatalog: LoadedCatalog,
  gameData: GameWithRoundsV03,
  playerGhinMap: Map<string, string | null>,
  courseCache: Map<string, co.loaded<typeof Course>>,
  teeCache: Map<string, co.loaded<typeof Tee>>,
  workerGroup: Group,
): Promise<{
  success: boolean;
  error?: string;
  gameCreated: boolean;
  courses: { created: number; updated: number; skipped: number };
  tees: { created: number; updated: number; skipped: number };
  rounds: { created: number; updated: number; skipped: number };
}> {
  const { game, rounds: roundsData, gamespecKey } = gameData;

  // Catalog is already loaded - just access the maps directly
  // Use type assertions since we verified loading in importGamesFromArango
  const gamesMap = loadedCatalog.games as MapOfGames | undefined;
  const playersMap = loadedCatalog.players as MapOfPlayers | undefined;
  const coursesMap = loadedCatalog.courses as MapOfCourses | undefined;

  if (!gamesMap || !playersMap || !coursesMap) {
    return {
      success: false,
      error: "Catalog maps not loaded",
      gameCreated: false,
      courses: { created: 0, updated: 0, skipped: 0 },
      tees: { created: 0, updated: 0, skipped: 0 },
      rounds: { created: 0, updated: 0, skipped: 0 },
    };
  }

  // Track stats
  const stats = {
    courses: { created: 0, updated: 0, skipped: 0 },
    tees: { created: 0, updated: 0, skipped: 0 },
    rounds: { created: 0, updated: 0, skipped: 0 },
  };

  // For idempotency: ALWAYS use workerGroup as owner for game-related upserts
  // upsertUnique derives CoValue ID from (unique + owner), so using the same
  // stable workerGroup ensures we always find/update existing games
  const gameGroup = workerGroup;

  // Check if game exists in catalog (for tracking created vs updated)
  const gameExistedInCatalog = gamesMap.$jazz.has(game._key);

  // Import rounds
  const roundToGames = ListOfRoundToGames.create([], { owner: gameGroup });

  for (const roundData of roundsData) {
    try {
      const { round, edge, playerId: playerLegacyId } = roundData;

      // Get tee and course data from first tee in round - do this FIRST before player lookup
      if (!round.tees || round.tees.length === 0) {
        console.warn(`Round ${round._key} has no tee data, skipping`);
        continue;
      }

      const teeData = round.tees[0];
      const upsertResult = await upsertCourse(
        coursesMap,
        teeData.course,
        teeData,
        workerAccount,
        courseCache,
        teeCache,
      );

      // If upsertCourse returns null, failed to load course - skip this round
      if (!upsertResult) {
        console.warn(
          `Failed to load course ${teeData.course.course_id}, skipping round ${round._key}`,
        );
        stats.courses.skipped++;
        stats.rounds.skipped++;
        continue;
      }

      const { course, tee, courseCreated, teeCreated } = upsertResult;

      // Track course and tee stats
      if (courseCreated) {
        stats.courses.created++;
      } else {
        stats.courses.updated++;
      }

      if (teeCreated) {
        stats.tees.created++;
      } else {
        stats.tees.updated++;
      }

      // Look up player in catalog - try GHIN ID first, then manual ID
      // Skip round creation if player not found, but course was already upserted above
      if (!playerLegacyId) {
        console.warn(
          `Round ${round._key} has no playerId, skipping round creation`,
        );
        stats.rounds.skipped++;
        continue;
      }

      // Look up player's GHIN ID from cache
      const ghinId = playerGhinMap.get(playerLegacyId);
      const mapKey = ghinId || `manual_${playerLegacyId}`;

      if (!playersMap.$jazz.has(mapKey)) {
        console.warn(
          `Player not found in catalog: ${mapKey}, skipping round creation`,
        );
        stats.rounds.skipped++;
        continue;
      }

      // Get player reference and load if needed
      let player = playersMap[mapKey];
      if (!player) {
        console.warn(`Player is null: ${mapKey}, skipping round creation`);
        stats.rounds.skipped++;
        continue;
      }

      // If player isn't loaded, try to load it
      if (!player.$isLoaded) {
        const loadedPlayer = await Player.load(player.$jazz.id, {});
        if (!loadedPlayer || !loadedPlayer.$isLoaded) {
          console.warn(
            `Player failed to load: ${mapKey}, skipping round creation`,
          );
          stats.rounds.skipped++;
          continue;
        }
        player = loadedPlayer;
      }

      // Upsert round with embedded course and tee (idempotent)
      // Note: upsertRound handles created vs updated internally via upsertUnique
      stats.rounds.created++;

      const createdRound = await upsertRound(
        round,
        edge,
        player,
        course,
        tee,
        workerGroup,
      );

      // Upsert RoundToGame edge using composite key (round + game legacy IDs)
      // NOTE: We intentionally do NOT import courseHandicap from ArangoDB.
      // The app calculates it dynamically from handicapIndex and tee ratings.
      // ArangoDB values were often off-by-one due to different rounding.
      const roundToGame = await RoundToGame.upsertUnique({
        unique: `${round._key}-${game._key}`,
        value: {
          round: createdRound,
          handicapIndex: edge.handicap_index,
        },
        owner: gameGroup,
      });

      if (!roundToGame?.$isLoaded) {
        throw new Error(`Failed to upsert RoundToGame for round ${round._key}`);
      }

      // Delete any existing courseHandicap/gameHandicap - we calculate dynamically now
      if (roundToGame.$jazz.has("courseHandicap")) {
        roundToGame.$jazz.delete("courseHandicap");
      }
      if (roundToGame.$jazz.has("gameHandicap")) {
        roundToGame.$jazz.delete("gameHandicap");
      }

      // @ts-expect-error - upsertUnique returns MaybeLoaded but we've verified $isLoaded above
      roundToGames.$jazz.push(roundToGame);
    } catch (error) {
      console.error(`Failed to import round ${roundData.round._key}:`, error);
    }
  }

  // Create GameHoles with Teams
  const gameHoles = ListOfGameHoles.create([], { owner: gameGroup });

  for (let i = 0; i < game.holes.length; i++) {
    const holeData = game.holes[i];
    const holeNumber = Number.parseInt(holeData.hole, 10);

    // Create teams for this hole
    const teams = ListOfTeams.create([], { owner: gameGroup });

    for (const teamData of holeData.teams) {
      const teamRounds = ListOfRoundToTeams.create([], {
        owner: gameGroup,
      });

      // Match players to rounds
      for (const playerLegacyId of teamData.players) {
        // Find the roundToGame for this player
        for (let j = 0; j < roundToGames.length; j++) {
          const rtg = roundToGames[j];
          if (!rtg?.round) continue;

          // Look up player's GHIN ID from cache
          const ghinId = playerGhinMap.get(playerLegacyId);
          const mapKey = ghinId || `manual_${playerLegacyId}`;

          const player = playersMap[mapKey];
          if (player && rtg.round.playerId === player.$jazz.id) {
            const roundToTeam = RoundToTeam.create(
              { roundToGame: rtg },
              { owner: gameGroup },
            );
            teamRounds.$jazz.push(roundToTeam);
            break;
          }
        }
      }

      const team = Team.create(
        {
          team: teamData.team,
          rounds: teamRounds,
        },
        { owner: gameGroup },
      );

      // Collect team options from junk and multipliers
      const hasJunk = teamData.junk && teamData.junk.length > 0;
      const teamMultipliers = holeData.multipliers?.filter(
        (m) => m.team === teamData.team,
      );
      const hasMultipliers = teamMultipliers && teamMultipliers.length > 0;

      if (hasJunk || hasMultipliers) {
        const teamOptions = ListOfTeamOptions.create([], {
          owner: gameGroup,
        });

        // Add junk as team options with player attribution
        if (hasJunk && teamData.junk) {
          for (const junkItem of teamData.junk) {
            // Look up player's GHIN ID from cache
            const ghinId = playerGhinMap.get(junkItem.player);
            const mapKey = ghinId || `manual_${junkItem.player}`;

            const player = playersMap[mapKey];

            const teamOption = TeamOption.create(
              {
                optionName: junkItem.name,
                value: junkItem.value,
              },
              { owner: gameGroup },
            );

            if (player) {
              teamOption.$jazz.set("playerId", player.$jazz.id);
            }

            teamOptions.$jazz.push(teamOption);
          }
        }

        // Add multipliers as team options (no player attribution - team-level)
        // IMPORTANT: For rest_of_nine multipliers (like pre_double), the old schema
        // stores the multiplier on EVERY hole it applies to. The new schema only
        // stores it on the first_hole. Skip if this hole isn't the first_hole.
        if (hasMultipliers && teamMultipliers) {
          for (const mult of teamMultipliers) {
            // Only write the multiplier on its first_hole to avoid duplication
            // The new scoring engine inherits multipliers from previous holes
            if (mult.first_hole && mult.first_hole !== holeData.hole) {
              continue;
            }

            const teamOption = TeamOption.create(
              {
                optionName: mult.name,
                value: String(mult.value),
              },
              { owner: gameGroup },
            );

            // Store first_hole for multi-hole multipliers like pre_double
            if (mult.first_hole) {
              teamOption.$jazz.set("firstHole", mult.first_hole);
            }

            teamOptions.$jazz.push(teamOption);
          }
        }

        team.$jazz.set("options", teamOptions);
      }

      teams.$jazz.push(team);
    }

    const gameHole = GameHole.create(
      {
        hole: holeData.hole,
        seq: holeNumber,
        teams,
      },
      { owner: gameGroup },
    );

    // Add game-level per-hole options if present
    const catalogOptions = loadedCatalog.options;
    if (game.options && game.options.length > 0 && catalogOptions?.$isLoaded) {
      const holeOptions = MapOfOptions.create({}, { owner: gameGroup });

      for (const option of game.options) {
        // Skip game-level options (they have a value field, not values array)
        if (
          !("values" in option) ||
          !option.values ||
          !Array.isArray(option.values)
        ) {
          continue;
        }
        for (const valueSet of option.values) {
          if (valueSet?.holes?.includes(holeData.hole)) {
            // Find option in catalog - use $jazz.has to check existence
            if (catalogOptions.$jazz.has(option.name)) {
              const catalogOption = catalogOptions[option.name];
              if (catalogOption?.$isLoaded) {
                // Option is loaded, we can reference it
                // @ts-expect-error - MaybeLoaded nested types in migration code
                holeOptions.$jazz.set(option.name, catalogOption);
              }
            }
          }
        }
      }

      if (Object.keys(holeOptions).length > 0) {
        gameHole.$jazz.set("options", holeOptions);
      }
    }

    gameHoles.$jazz.push(gameHole);
  }

  // Build players list
  const players = ListOfPlayers.create([], { owner: gameGroup });
  const uniquePlayerIds = new Set<string>();

  for (let i = 0; i < roundToGames.length; i++) {
    const rtg = roundToGames[i];
    if (!rtg?.round) continue;

    const playerId = rtg.round.playerId;
    if (!uniquePlayerIds.has(playerId)) {
      uniquePlayerIds.add(playerId);

      // Find player in catalog
      for (const key of Object.keys(playersMap)) {
        const player = playersMap[key];
        if (player?.$isLoaded && player.$jazz.id === playerId) {
          // Player is loaded, safe to push
          // @ts-expect-error - MaybeLoaded nested types in migration code
          players.$jazz.push(player);
          break;
        }
      }
    }
  }

  // Build specs list (try to find gamespec in catalog by legacyId)
  const specs = ListOfGameSpecs.create([], { owner: gameGroup });
  const specsMap = loadedCatalog.specs as MapOfGameSpecs | undefined;
  let gameSpec: GameSpec | null = null;
  if (gamespecKey && specsMap) {
    // Normalize legacy Match Play keys to consolidated "matchplay" spec
    // Old keys: "72068149" (individual), "72068183" (team) -> "matchplay"
    const normalizedKey =
      gamespecKey === "72068149" || gamespecKey === "72068183"
        ? "matchplay"
        : gamespecKey;

    // Find spec by matching legacyId (ArangoDB _key)
    for (const key of Object.keys(specsMap)) {
      const spec = specsMap[key];
      if (spec?.$isLoaded && spec.legacyId === normalizedKey) {
        gameSpec = spec as GameSpec;
        // @ts-expect-error - MaybeLoaded types in migration code, spec is verified loaded
        specs.$jazz.push(spec);
        break;
      }
    }
  }

  // Build scope with teamsConfig
  // Start with gamespec's teamsConfig as template, then apply instance-specific overrides
  let teamCount: number;
  let rotateEvery: number;
  let maxPlayersPerTeam: number | undefined;

  if (
    gameSpec?.$isLoaded &&
    gameSpec.$jazz.has("teamsConfig") &&
    gameSpec.teamsConfig?.$isLoaded
  ) {
    // Use gamespec's teamsConfig as defaults
    teamCount = gameSpec.teamsConfig.teamCount;
    rotateEvery = gameSpec.teamsConfig.rotateEvery;
    maxPlayersPerTeam = gameSpec.teamsConfig.maxPlayersPerTeam;
  } else {
    // Fallback if no gamespec teamsConfig
    teamCount = players.length;
    rotateEvery = 0;
  }

  // Override with instance-specific teams_rotate from v0.3 data if present
  if (game.scope.teams_rotate) {
    const parsed = Number.parseInt(game.scope.teams_rotate, 10);
    if (!Number.isNaN(parsed)) {
      rotateEvery = parsed;
    }
  }

  const teamsConfig = TeamsConfig.create(
    {
      teamCount,
      rotateEvery,
    },
    { owner: gameGroup },
  );

  // Set optional maxPlayersPerTeam if defined
  if (maxPlayersPerTeam !== undefined) {
    teamsConfig.$jazz.set("maxPlayersPerTeam", maxPlayersPerTeam);
  }

  // Create scope with required fields only
  const scope = GameScope.create(
    {
      holes: game.scope.holes as "all18" | "front9" | "back9",
    },
    { owner: gameGroup },
  );

  // Set optional CoMap field after creation
  scope.$jazz.set("teamsConfig", teamsConfig);

  // Debug: log what we're about to upsert
  console.log(
    `Upserting game ${game._key}: rounds=${roundToGames.length}, players=${players.length}, specs=${specs.length}, holes=${gameHoles.length}`,
  );

  // Upsert the game using legacyId as unique key (idempotent)
  const createdGame = await Game.upsertUnique({
    unique: game._key,
    value: {
      start: new Date(game.start),
      name: game.name,
      scope,
      specs,
      holes: gameHoles,
      players,
      rounds: roundToGames,
      legacyId: game._key,
    },
    owner: gameGroup,
  });

  if (!createdGame || !createdGame.$isLoaded) {
    throw new Error(`Failed to upsert game: ${game._key}`);
  }

  // Import game-level option overrides from v0.3 data
  // v0.3 game options have two types:
  // 1. Game-level: {name, disp, type, value} - applies to entire game
  // 2. Hole-level: {name, values: [{value, holes}]} - applies to specific holes
  const catalogOptions = loadedCatalog.options;
  if (game.options && game.options.length > 0 && catalogOptions?.$isLoaded) {
    const gameOptionsMap = MapOfOptions.create({}, { owner: gameGroup });

    for (const option of game.options) {
      // Skip hole-level options (they have a values array, handled elsewhere)
      if ("values" in option && option.values && Array.isArray(option.values)) {
        continue;
      }

      // Game-level option - copy from catalog and set value override
      if (
        "value" in option &&
        option.name &&
        option.value &&
        catalogOptions.$jazz.has(option.name)
      ) {
        const catalogOption = catalogOptions[option.name];
        if (catalogOption?.$isLoaded && catalogOption.type === "game") {
          const gameOption = catalogOption as GameOption;

          // Create new option for this game
          const newOption = GameOption.create(
            {
              name: gameOption.name,
              disp: gameOption.disp,
              type: "game",
              version: gameOption.version,
              valueType: gameOption.valueType,
              defaultValue: gameOption.defaultValue,
            },
            { owner: gameGroup },
          );

          // Copy choices if they exist
          if (
            gameOption.$jazz.has("choices") &&
            gameOption.choices?.$isLoaded
          ) {
            // @ts-expect-error - MaybeLoaded types in migration code
            newOption.$jazz.set("choices", gameOption.choices);
          }

          // Copy seq if it exists
          if (gameOption.$jazz.has("seq") && gameOption.seq !== undefined) {
            newOption.$jazz.set("seq", gameOption.seq);
          }

          // Set the value from v0.3 data
          newOption.$jazz.set("value", option.value);

          // Add to game options map
          gameOptionsMap.$jazz.set(option.name, newOption);
        }
      }
    }

    // Set game.options if we created any options
    if (Object.keys(gameOptionsMap).length > 0) {
      createdGame.$jazz.set("options", gameOptionsMap);
    }
  }

  // Add to catalog map for enumeration (idempotent - same key overwrites)
  gamesMap.$jazz.set(game._key, createdGame);
  console.log(
    `Set game ${game._key} in catalog, game.id=${createdGame.$jazz.id}`,
  );

  return {
    success: true,
    gameCreated: !gameExistedInCatalog,
    courses: stats.courses,
    tees: stats.tees,
    rounds: stats.rounds,
  };
}

/**
 * Options for game import
 */
export interface GameImportOptions {
  /** If provided, only import this specific game by its legacy ArangoDB _key */
  legacyId?: string;
  /** Batch size for processing games (default: 10) */
  batchSize?: number;
}

/**
 * Import games from ArangoDB in batches (idempotent)
 *
 * @param workerAccount - Worker account
 * @param arangoConfig - ArangoDB configuration (optional)
 * @param options - Import options (legacyId for single game, batchSize)
 * @returns GameImportResult with import statistics
 */
export async function importGamesFromArango(
  workerAccount: co.loaded<typeof PlayerAccount>,
  arangoConfig?: ArangoConfig,
  options?: GameImportOptions,
): Promise<GameImportResult> {
  const batchSize = options?.batchSize ?? 10;
  const singleGameId = options?.legacyId;
  const db = createArangoConnection(arangoConfig || defaultConfig);
  const catalog = await loadOrCreateCatalog(workerAccount);

  const result: GameImportResult = {
    games: { created: 0, updated: 0, skipped: 0, failed: 0 },
    courses: { created: 0, updated: 0, skipped: 0 },
    tees: { created: 0, updated: 0, skipped: 0 },
    rounds: { created: 0, updated: 0, skipped: 0 },
    errors: [],
  };

  try {
    // Load catalog ONCE with all required maps - avoid repeated ensureLoaded calls
    console.log("Loading catalog maps...");
    let loadedCatalog = await catalog.$jazz.ensureLoaded({
      resolve: { games: {}, players: {}, specs: {}, options: {}, courses: {} },
    });

    // Initialize maps if needed (one-time setup)
    if (!loadedCatalog.$jazz.has("games")) {
      const group = Group.create(workerAccount);
      group.makePublic();
      loadedCatalog.$jazz.set("games", MapOfGames.create({}, { owner: group }));
    }
    if (!loadedCatalog.$jazz.has("courses")) {
      const group = Group.create(workerAccount);
      group.makePublic();
      loadedCatalog.$jazz.set(
        "courses",
        MapOfCourses.create({}, { owner: group }),
      );
    }

    // Re-load after initialization to get the new maps
    // Load specs with $each: true to ensure each spec is loaded for legacyId matching
    loadedCatalog = await catalog.$jazz.ensureLoaded({
      resolve: {
        games: {},
        players: {},
        specs: { $each: true },
        options: {},
        courses: {},
      },
    });

    if (
      !loadedCatalog.games ||
      !loadedCatalog.players ||
      !loadedCatalog.courses
    ) {
      throw new Error("Failed to load catalog maps");
    }

    console.log("Catalog maps loaded");

    // Get the worker's root group for stable upsertUnique operations
    // This ensures the same legacyId always refers to the same CoValue across imports
    const loadedWorker = await workerAccount.$jazz.ensureLoaded({
      resolve: { root: true },
    });
    if (!loadedWorker.root) {
      throw new Error("Worker account has no root");
    }
    const workerGroup = loadedWorker.root.$jazz.owner as Group;
    console.log(`workerGroup ID: ${workerGroup.$jazz.id}`);

    // Create course cache to avoid repeated Course.load calls
    const courseCache = new Map<string, co.loaded<typeof Course>>();
    const teeCache = new Map<string, co.loaded<typeof Tee>>();

    // Pre-fetch all player GHIN IDs to avoid N+1 queries
    console.log("Pre-fetching player GHIN IDs...");
    const playerGhinCursor = await db.query(`
      FOR player IN players
        RETURN { key: player._key, ghinId: player.handicap.id }
    `);
    const playerGhinMap = new Map<string, string | null>();
    for await (const player of playerGhinCursor) {
      playerGhinMap.set(player.key, player.ghinId || null);
    }
    console.log(`Cached ${playerGhinMap.size} player GHIN lookups`);

    // Single game import mode
    if (singleGameId) {
      console.log(`Importing single game: ${singleGameId}`);

      try {
        const gameWithRounds = await fetchGameWithRounds(db, singleGameId);

        if (!gameWithRounds) {
          result.games.failed++;
          result.errors.push({
            gameId: singleGameId,
            error: "Game not found",
          });
          return result;
        }

        const importResult = await importGame(
          workerAccount,
          loadedCatalog,
          gameWithRounds,
          playerGhinMap,
          courseCache,
          teeCache,
          workerGroup,
        );

        if (importResult.success) {
          if (importResult.gameCreated) {
            result.games.created++;
          } else {
            result.games.updated++;
          }
          result.courses.created += importResult.courses.created;
          result.courses.updated += importResult.courses.updated;
          result.courses.skipped += importResult.courses.skipped;
          result.tees.created += importResult.tees.created;
          result.tees.updated += importResult.tees.updated;
          result.tees.skipped += importResult.tees.skipped;
          result.rounds.created += importResult.rounds.created;
          result.rounds.updated += importResult.rounds.updated;
          result.rounds.skipped += importResult.rounds.skipped;
        } else {
          result.games.failed++;
          result.errors.push({
            gameId: singleGameId,
            error: importResult.error || "Unknown error",
          });
        }
      } catch (error) {
        result.games.failed++;
        result.errors.push({
          gameId: singleGameId,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      console.log("Single game import complete:", result);
      return result;
    }

    // Batch import mode - fetch total count and first batch
    const { games, total } = await fetchAllGames(db, 0, batchSize);

    console.log(`Importing ${total} games in batches of ${batchSize}...`);

    // Process all batches
    let offset = 0;
    let currentBatch = games;

    while (currentBatch.length > 0) {
      console.log(
        `Processing batch: ${offset + 1}-${offset + currentBatch.length} of ${total}`,
      );

      // Process each game in the batch
      for (const gameListItem of currentBatch) {
        try {
          // Fetch full game with rounds
          const gameWithRounds = await fetchGameWithRounds(
            db,
            gameListItem._key,
          );

          if (!gameWithRounds) {
            result.games.failed++;
            result.errors.push({
              gameId: gameListItem._key,
              error: "Game not found",
            });
            continue;
          }

          // Import the game
          const importResult = await importGame(
            workerAccount,
            loadedCatalog,
            gameWithRounds,
            playerGhinMap,
            courseCache,
            teeCache,
            workerGroup,
          );

          if (importResult.success) {
            // Track game created vs updated
            if (importResult.gameCreated) {
              result.games.created++;
            } else {
              result.games.updated++;
            }
            // Aggregate course, tee, and round stats
            result.courses.created += importResult.courses.created;
            result.courses.updated += importResult.courses.updated;
            result.courses.skipped += importResult.courses.skipped;
            result.tees.created += importResult.tees.created;
            result.tees.updated += importResult.tees.updated;
            result.tees.skipped += importResult.tees.skipped;
            result.rounds.created += importResult.rounds.created;
            result.rounds.updated += importResult.rounds.updated;
            result.rounds.skipped += importResult.rounds.skipped;
          } else {
            result.games.failed++;
            result.errors.push({
              gameId: gameListItem._key,
              error: importResult.error || "Unknown error",
            });
          }
        } catch (error) {
          result.games.failed++;
          result.errors.push({
            gameId: gameListItem._key,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Fetch next batch
      offset += batchSize;
      if (offset < total) {
        const nextBatch = await fetchAllGames(db, offset, batchSize);
        currentBatch = nextBatch.games;
      } else {
        currentBatch = [];
      }
    }

    console.log("Game import complete:", result);
  } catch (error) {
    console.error("Failed to import games:", error);
    throw error;
  }

  return result;
}
