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
const VALID_SCOPES = [
  "player",
  "team",
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

function isValidScope(
  value: unknown,
): value is "player" | "team" | "hole" | "rest_of_nine" | "game" {
  return (
    typeof value === "string" &&
    (VALID_SCOPES as readonly string[]).includes(value)
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

import type { Database } from "arangojs";
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
  JunkOption,
  ListOfClubs,
  ListOfGameHoles,
  ListOfGameSpecs,
  ListOfPlayers,
  ListOfRoundToGames,
  ListOfRoundToTeams,
  ListOfScoreUpdate,
  ListOfTeamOptions,
  ListOfTeams,
  ListOfTeeHoles,
  ListOfTees,
  ListOfValues,
  MapOfCourses,
  type MapOfGameSpecs,
  MapOfGames,
  MapOfOptions,
  MapOfPlayers,
  MapOfScores,
  MultiplierOption,
  Player,
  type PlayerAccount,
  Round,
  RoundToGame,
  RoundToTeam,
  Score,
  Team,
  TeamOption,
  Tee,
  TeeHole,
  Value,
} from "spicylib/schema";
import { transformGameSpec } from "spicylib/transform";
import type {
  GameSpecV03,
  GameWithRoundsV03,
  RoundToGameEdgeV03,
  RoundV03,
  TeeRating,
} from "../utils/arango";
import {
  type ArangoConfig,
  createArangoConnection,
  defaultConfig,
  fetchAllGames,
  fetchGameSpecs,
  fetchGameWithRounds,
  fetchPlayersWithGames,
} from "../utils/arango";
import { loadAllGameSpecs } from "../utils/json-reader";

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
type GameOptionData = {
  type: "game";
  name: string;
  disp: string;
  version: string;
  valueType: "bool" | "num" | "menu" | "text";
  defaultValue: string;
  seq?: number;
  choices?: Array<{ name: string; disp: string }>;
};

type JunkOptionData = {
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
};

type MultiplierOptionData = {
  type: "multiplier";
  name: string;
  disp: string;
  version: string;
  sub_type?: string;
  value: number;
  seq?: number;
  icon?: string;
  based_on?: string;
  scope?: string;
  availability?: string;
  override?: boolean;
};

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
 */
export async function upsertGameSpec(
  catalog: GameCatalog,
  specData: GameSpecV03,
  catalogOptions?: MapOfOptions,
): Promise<{ created: boolean; updated: boolean }> {
  const loadedCatalog = await catalog.$jazz.ensureLoaded({
    resolve: { specs: {}, options: {} },
  });

  if (!loadedCatalog.specs) {
    throw new Error("Catalog specs is null");
  }

  const specs: MapOfGameSpecs = loadedCatalog.specs;
  const key = `${specData.disp}-${specData.version}`;
  const exists = specs.$jazz.has(key);

  const transformed = transformGameSpec(specData);

  const newSpec = GameSpec.create(
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

  if (transformed.long_description) {
    newSpec.$jazz.set("long_description", transformed.long_description);
  }

  // Populate spec.options with references to catalog options
  if (transformed.options && transformed.options.length > 0 && catalogOptions) {
    const specOptionsMap: Record<string, unknown> = {};

    for (const opt of transformed.options) {
      // Reference the option from catalog.options
      const catalogOption = catalogOptions[opt.name];
      if (catalogOption) {
        specOptionsMap[opt.name] = catalogOption;
      }
    }

    newSpec.$jazz.set("options", specOptionsMap as MapOfOptions);
  }

  specs.$jazz.set(key, newSpec);

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
      if (opt.scope && isValidScope(opt.scope)) {
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
      const newOption = MultiplierOption.create(
        {
          name: opt.name,
          disp: opt.disp,
          type: "multiplier",
          version: opt.version,
          value: opt.value,
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
      if (opt.scope && isValidScope(opt.scope)) {
        newOption.$jazz.set("scope", opt.scope);
      }
      if (opt.availability && typeof opt.availability === "string") {
        newOption.$jazz.set("availability", opt.availability);
      }
      if (opt.override !== undefined && typeof opt.override === "boolean") {
        newOption.$jazz.set("override", opt.override);
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
 * Merge game specs from both ArangoDB and JSON sources
 */
export async function mergeGameSpecSources(
  arangoConfig?: ArangoConfig,
): Promise<GameSpecV03[]> {
  const [jsonSpecs, arangoSpecs] = await Promise.all([
    loadAllGameSpecs(),
    fetchGameSpecs(createArangoConnection(arangoConfig || defaultConfig)).catch(
      () => {
        console.warn("Failed to fetch from ArangoDB, using JSON only");
        return [];
      },
    ),
  ]);

  console.log(
    "Loaded from JSON:",
    jsonSpecs.length,
    jsonSpecs.map((s: GameSpecV03) => s.disp),
  );
  console.log(
    "Loaded from ArangoDB:",
    arangoSpecs.length,
    arangoSpecs.map((s: GameSpecV03) => s.disp),
  );

  const specMap = new Map<string, GameSpecV03>();

  for (const spec of jsonSpecs) {
    const key = `${spec.disp}-${spec.version}`;
    specMap.set(key, spec);
  }

  for (const spec of arangoSpecs) {
    const key = `${spec.disp}-${spec.version}`;
    specMap.set(key, spec);
  }

  return Array.from(specMap.values());
}

/**
 * Import players from ArangoDB (idempotent)
 *
 * Uses GHIN ID as unique identifier via Player.upsertUnique
 * Players are stored as individual docs owned by the worker account
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

          handicap = Handicap.create(
            {
              source: arangoPlayer.handicap.source,
              display: arangoPlayer.handicap.display,
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
 * Import all game specs to the catalog (idempotent)
 */
export async function importGameSpecsToCatalog(
  workerAccount: co.loaded<typeof PlayerAccount>,
  arangoConfig?: ArangoConfig,
): Promise<ImportResult> {
  console.log("Starting import to catalog for worker:", workerAccount.$jazz.id);

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

  // Second pass: Import all collected options
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

  console.log(`Importing ${validSpecs.length} specs with option references...`);
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

  // Fourth pass: Import players
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

  return result;
}

/**
 * Game Import Result Interface
 */
export interface GameImportResult {
  games: { total: number; imported: number; skipped: number; failed: number };
  courses: { created: number; updated: number };
  rounds: { created: number };
  errors: Array<{ gameId: string; error: string }>;
}

/**
 * Upsert a course and tee into the catalog (idempotent)
 *
 * @param catalog - The game catalog
 * @param courseData - Course metadata from ArangoDB
 * @param teeData - Tee data from ArangoDB round
 * @param workerAccount - Worker account for creating groups
 * @returns Object with courseId and teeId strings
 */
async function upsertCourse(
  catalog: GameCatalog,
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
    Ratings: {
      total?: TeeRating;
      front?: TeeRating;
      back?: TeeRating;
    };
  },
  workerAccount: co.loaded<typeof PlayerAccount>,
): Promise<{ courseId: string; teeId: string }> {
  // Initialize catalog.courses if needed
  const loadedCatalog = await catalog.$jazz.ensureLoaded({
    resolve: { courses: {} },
  });

  if (!loadedCatalog.$jazz.has("courses")) {
    const group = Group.create(workerAccount);
    group.makePublic();
    const newMap = MapOfCourses.create({}, { owner: group });
    loadedCatalog.$jazz.set("courses", newMap);
  }

  const coursesMap = loadedCatalog.courses;
  if (!coursesMap) {
    throw new Error("Failed to initialize courses map");
  }

  const courseKey = courseData.course_id;

  // Check if course exists, create if not
  if (!coursesMap.$jazz.has(courseKey)) {
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
  }

  // Load course
  const existingCourse = coursesMap[courseKey];
  if (!existingCourse?.$isLoaded) {
    throw new Error(`Course exists but is not loaded: ${courseKey}`);
  }

  const loadedCourse = await Course.load(existingCourse.$jazz.id, {
    loadAs: workerAccount,
    resolve: { tees: true },
  });
  if (!loadedCourse || !loadedCourse.$isLoaded) {
    throw new Error(`Failed to load course: ${courseKey}`);
  }

  // tees is now loaded via resolve - safe to access
  const teesList = loadedCourse.tees as ListOfTees;

  // Check if tee exists on course
  const teeKey = teeData.tee_id;
  let teeExists = false;

  for (let i = 0; i < teesList.length; i++) {
    const tee = teesList[i];
    if (tee?.$isLoaded && tee.id === teeKey) {
      teeExists = true;
      break;
    }
  }

  // Create tee if it doesn't exist
  if (!teeExists) {
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

    // Build ratings object with proper types
    const ratings = {
      total: teeData.Ratings.total || { rating: 0, slope: 0, bogey: 0 },
      front: teeData.Ratings.front || { rating: 0, slope: 0, bogey: 0 },
      back: teeData.Ratings.back || { rating: 0, slope: 0, bogey: 0 },
    };

    const tee = Tee.create(
      {
        id: teeKey,
        name: teeData.name,
        gender,
        holes: holesList,
        holesCount: teeData.holes.length,
        totalYardage: teeData.TotalYardage,
        totalMeters: Math.round(teeData.TotalYardage * 0.9144),
        ratings,
      },
      { owner: group },
    );

    teesList.$jazz.push(tee);
  }

  return { courseId: courseKey, teeId: teeKey };
}

/**
 * Create a Round from ArangoDB round data
 *
 * @param roundData - Round data from ArangoDB
 * @param edgeData - RoundToGame edge data with handicap info
 * @param playerId - Player ID string
 * @param courseId - Course ID string
 * @param teeId - Tee ID string
 * @param group - Jazz group to own the round
 * @returns Created Round
 */
function createRound(
  roundData: RoundV03,
  edgeData: RoundToGameEdgeV03,
  playerId: string,
  courseId: string,
  teeId: string,
  group: Group,
): Round {
  // Create scores map - convert hole numbers "1"-"18" to "0"-"17"
  const scoresMap = MapOfScores.create({}, { owner: group });

  for (const scoreData of roundData.scores) {
    const holeNumber = Number.parseInt(scoreData.hole, 10);
    const holeIndex = String(holeNumber - 1); // "1" -> "0", "18" -> "17"

    const valuesList = ListOfValues.create([], { owner: group });

    for (const val of scoreData.values) {
      const value = Value.create(
        {
          k: val.k,
          v: val.v,
          byPlayerId: playerId,
          at: val.ts ? new Date(val.ts) : new Date(roundData.date),
        },
        { owner: group },
      );
      valuesList.$jazz.push(value);
    }

    const score = Score.create(
      {
        seq: holeNumber,
        values: valuesList,
        history: ListOfScoreUpdate.create([], { owner: group }),
      },
      { owner: group },
    );

    scoresMap.$jazz.set(holeIndex, score);
  }

  // Create round
  const round = Round.create(
    {
      createdAt: new Date(roundData.date),
      playerId,
      handicapIndex: edgeData.handicap_index,
      scores: scoresMap,
      legacyId: roundData._key,
      courseId,
      teeId,
    },
    { owner: group },
  );

  return round;
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
async function importGame(
  workerAccount: co.loaded<typeof PlayerAccount>,
  catalog: GameCatalog,
  gameData: GameWithRoundsV03,
  db: Database,
): Promise<{ success: boolean; error?: string }> {
  const { game, rounds: roundsData, gamespecKey } = gameData;

  // Load catalog with games map
  let loadedCatalog = await catalog.$jazz.ensureLoaded({
    resolve: { games: {}, players: {}, specs: {}, courses: {} },
  });

  // Initialize games map if needed
  if (!loadedCatalog.$jazz.has("games")) {
    const group = Group.create(workerAccount);
    group.makePublic();
    const newMap = MapOfGames.create({}, { owner: group });
    loadedCatalog.$jazz.set("games", newMap);

    loadedCatalog = await catalog.$jazz.ensureLoaded({
      resolve: { games: {}, players: {}, specs: {}, courses: {} },
    });
  }

  const gamesMap = loadedCatalog.games;
  if (!gamesMap) {
    throw new Error("Failed to initialize games map");
  }

  // Skip if already imported (idempotent)
  if (gamesMap.$jazz.has(game._key)) {
    return { success: true }; // Already imported
  }

  const playersMap = loadedCatalog.players;
  if (!playersMap) {
    return { success: false, error: "Players map not initialized" };
  }

  // Create public group for game
  const gameGroup = Group.create(workerAccount);
  gameGroup.makePublic();

  // Import rounds
  const roundToGames = ListOfRoundToGames.create([], { owner: gameGroup });

  for (const roundData of roundsData) {
    try {
      const { round, edge, playerId: playerLegacyId } = roundData;

      // Look up player in catalog - try GHIN ID first, then manual ID
      // Query ArangoDB to get player's GHIN ID
      const playerCursor = await db.query(
        `
        FOR player IN players
          FILTER player._key == @playerKey
          RETURN player.handicap.id
      `,
        { playerKey: playerLegacyId },
      );

      const ghinId = (await playerCursor.next()) as string | undefined;
      const mapKey = ghinId || `manual_${playerLegacyId}`;

      if (!playersMap.$jazz.has(mapKey)) {
        console.warn(`Player not found in catalog: ${mapKey}, skipping round`);
        continue;
      }

      const player = playersMap[mapKey];
      if (!player) {
        console.warn(`Player is null: ${mapKey}, skipping round`);
        continue;
      }

      // Get tee and course data from first tee in round
      if (!round.tees || round.tees.length === 0) {
        console.warn(`Round ${round._key} has no tee data, skipping`);
        continue;
      }

      const teeData = round.tees[0];
      const { courseId, teeId } = await upsertCourse(
        catalog,
        teeData.course,
        teeData,
        workerAccount,
      );

      // Create round
      const createdRound = createRound(
        round,
        edge,
        player.$jazz.id,
        courseId,
        teeId,
        gameGroup,
      );

      // Create RoundToGame edge
      const roundToGame = RoundToGame.create(
        {
          round: createdRound,
          handicapIndex: edge.handicap_index,
        },
        { owner: gameGroup },
      );

      if (edge.course_handicap !== undefined) {
        roundToGame.$jazz.set("courseHandicap", edge.course_handicap);
      }
      if (edge.game_handicap !== undefined) {
        roundToGame.$jazz.set("gameHandicap", edge.game_handicap);
      }

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

          // Query ArangoDB for player GHIN ID
          const playerCursor = await db.query(
            `
            FOR player IN players
              FILTER player._key == @playerKey
              RETURN player.handicap.id
          `,
            { playerKey: playerLegacyId },
          );

          const ghinId = (await playerCursor.next()) as string | undefined;
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

      // Add junk as team options with player attribution
      if (teamData.junk && teamData.junk.length > 0) {
        const teamOptions = ListOfTeamOptions.create([], {
          owner: gameGroup,
        });

        for (const junkItem of teamData.junk) {
          // Query ArangoDB for player GHIN ID
          const playerCursor = await db.query(
            `
            FOR player IN players
              FILTER player._key == @playerKey
              RETURN player.handicap.id
          `,
            { playerKey: junkItem.player },
          );

          const ghinId = (await playerCursor.next()) as string | undefined;
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
        for (const valueSet of option.values) {
          if (valueSet.holes.includes(holeData.hole)) {
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

  // Create Game
  // Build scope
  const scope = GameScope.create(
    {
      holes: game.scope.holes as "all18" | "front9" | "back9",
    },
    { owner: gameGroup },
  );

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

  // Build specs list (try to find gamespec in catalog)
  const specs = ListOfGameSpecs.create([], { owner: gameGroup });
  if (gamespecKey && loadedCatalog.specs) {
    // Try to find spec by matching name-version pattern
    for (const key of Object.keys(loadedCatalog.specs)) {
      if (key.includes(gamespecKey) || gamespecKey.includes(key)) {
        const spec = loadedCatalog.specs[key];
        if (spec?.$isLoaded) {
          // Spec is loaded, safe to push
          // @ts-expect-error - MaybeLoaded nested types in migration code
          specs.$jazz.push(spec);
          break;
        }
      }
    }
  }

  // Create the game
  const createdGame = Game.create(
    {
      start: new Date(game.start),
      name: game.name,
      scope,
      specs,
      holes: gameHoles,
      players,
      rounds: roundToGames,
      legacyId: game._key,
    },
    { owner: gameGroup },
  );

  // Add to catalog
  gamesMap.$jazz.set(game._key, createdGame);

  return { success: true };
}

/**
 * Import games from ArangoDB in batches (idempotent)
 *
 * @param workerAccount - Worker account
 * @param arangoConfig - ArangoDB configuration (optional)
 * @param batchSize - Number of games to process per batch (default: 10)
 * @returns GameImportResult with import statistics
 */
export async function importGamesFromArango(
  workerAccount: co.loaded<typeof PlayerAccount>,
  arangoConfig?: ArangoConfig,
  batchSize = 10,
): Promise<GameImportResult> {
  const db = createArangoConnection(arangoConfig || defaultConfig);
  const catalog = await loadOrCreateCatalog(workerAccount);

  const result: GameImportResult = {
    games: { total: 0, imported: 0, skipped: 0, failed: 0 },
    courses: { created: 0, updated: 0 },
    rounds: { created: 0 },
    errors: [],
  };

  try {
    // Fetch total count and first batch
    const { games, total } = await fetchAllGames(db, 0, batchSize);
    result.games.total = total;

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
            catalog,
            gameWithRounds,
            db,
          );

          if (importResult.success) {
            result.games.imported++;
            result.rounds.created += gameWithRounds.rounds.length;
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
