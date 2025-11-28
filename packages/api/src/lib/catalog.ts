/**
 * GameCatalog Management Utilities (API Server)
 *
 * Implements catalog CRUD operations for the worker account.
 * Handles idempotent imports from ArangoDB and JSON sources.
 */

import type { co } from "jazz-tools";
import {
  ChoiceMap,
  ChoicesList,
  type GameCatalog,
  GameOption,
  GameSpec,
  JunkOption,
  type MapOfGameOptions,
  type MapOfGameSpecs,
  type MapOfJunkOptions,
  type MapOfMultiplierOptions,
  MultiplierOption,
  type PlayerAccount,
} from "spicylib/schema";
import { transformGameSpec } from "spicylib/transform";
import type { GameSpecV03 } from "../utils/arango";
import {
  type ArangoConfig,
  createArangoConnection,
  defaultConfig,
  fetchGameSpecs,
} from "../utils/arango";
import { loadAllGameSpecs } from "../utils/json-reader";

export interface ImportResult {
  specs: {
    created: number;
    updated: number;
    skipped: number;
  };
  options: {
    game: { created: number; updated: number };
    junk: { created: number; updated: number };
    multiplier: { created: number; updated: number };
  };
  errors: Array<{ item: string; error: string }>;
}

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
): Promise<{ created: boolean; updated: boolean }> {
  const loadedCatalog = await catalog.$jazz.ensureLoaded({
    resolve: { specs: {} },
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

  specs.$jazz.set(key, newSpec);

  return { created: !exists, updated: exists };
}

/**
 * Upsert game options into the catalog (idempotent)
 */
async function upsertGameOptions(
  catalog: GameCatalog,
  options: Array<{
    name: string;
    disp: string;
    valueType: "bool" | "num" | "menu" | "text";
    defaultValue: string;
    choices?: Array<{ name: string; disp: string }>;
  }>,
): Promise<{ created: number; updated: number }> {
  const loadedCatalog = await catalog.$jazz.ensureLoaded({
    resolve: { gameOptions: {} },
  });

  if (!loadedCatalog.$jazz.has("gameOptions")) {
    const newMap = {} as MapOfGameOptions;
    loadedCatalog.$jazz.set("gameOptions", newMap);
  }

  const gameOptions = loadedCatalog.gameOptions;
  if (!gameOptions) {
    throw new Error("Failed to initialize gameOptions");
  }

  let created = 0;
  let updated = 0;

  for (const opt of options) {
    const exists = gameOptions.$jazz.has(opt.name);

    const newOption = GameOption.create(
      {
        name: opt.name,
        disp: opt.disp,
        type: "game",
        valueType: opt.valueType,
        defaultValue: opt.defaultValue,
      },
      { owner: gameOptions.$jazz.owner },
    );

    // Add choices if present (for menu type options)
    if (opt.choices && opt.choices.length > 0) {
      // Create the choices list if it doesn't exist
      if (!newOption.$jazz.has("choices")) {
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
    }

    gameOptions.$jazz.set(opt.name, newOption);

    if (exists) {
      updated++;
    } else {
      created++;
    }
  }

  return { created, updated };
}

/**
 * Upsert junk options into the catalog (idempotent)
 */
async function upsertJunkOptions(
  catalog: GameCatalog,
  options: Array<{
    name: string;
    disp: string;
    type: string;
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
  }>,
): Promise<{ created: number; updated: number }> {
  const loadedCatalog = await catalog.$jazz.ensureLoaded({
    resolve: { junkOptions: {} },
  });

  if (!loadedCatalog.$jazz.has("junkOptions")) {
    const newMap = {} as MapOfJunkOptions;
    loadedCatalog.$jazz.set("junkOptions", newMap);
  }

  const junkOptions = loadedCatalog.junkOptions;
  if (!junkOptions) {
    throw new Error("Failed to initialize junkOptions");
  }

  let created = 0;
  let updated = 0;

  for (const opt of options) {
    const exists = junkOptions.$jazz.has(opt.name);

    const newOption = JunkOption.create(
      {
        name: opt.name,
        disp: opt.disp,
        type: "junk",
        value: opt.value,
      },
      { owner: junkOptions.$jazz.owner },
    );

    // Set optional fields
    if (opt.type)
      newOption.$jazz.set("sub_type", opt.type as "dot" | "skin" | "carryover");
    if (opt.seq !== undefined) newOption.$jazz.set("seq", opt.seq);
    if (opt.scope)
      newOption.$jazz.set(
        "scope",
        opt.scope as "player" | "team" | "hole" | "rest_of_nine" | "game",
      );
    if (opt.icon) newOption.$jazz.set("icon", opt.icon);
    if (opt.show_in)
      newOption.$jazz.set("show_in", opt.show_in as "score" | "faves" | "none");
    if (opt.based_on)
      newOption.$jazz.set("based_on", opt.based_on as "gross" | "net" | "user");
    if (opt.limit) newOption.$jazz.set("limit", opt.limit);
    if (opt.calculation) newOption.$jazz.set("calculation", opt.calculation);
    if (opt.logic) newOption.$jazz.set("logic", opt.logic);
    if (opt.better)
      newOption.$jazz.set("better", opt.better as "lower" | "higher");
    if (opt.score_to_par) newOption.$jazz.set("score_to_par", opt.score_to_par);

    junkOptions.$jazz.set(opt.name, newOption);

    if (exists) {
      updated++;
    } else {
      created++;
    }
  }

  return { created, updated };
}

/**
 * Upsert multiplier options into the catalog (idempotent)
 */
async function upsertMultiplierOptions(
  catalog: GameCatalog,
  options: Array<{
    name: string;
    disp: string;
    value: number;
    seq?: number;
    icon?: string;
    based_on?: string;
    scope?: string;
    availability?: string;
  }>,
): Promise<{ created: number; updated: number }> {
  const loadedCatalog = await catalog.$jazz.ensureLoaded({
    resolve: { multiplierOptions: {} },
  });

  if (!loadedCatalog.$jazz.has("multiplierOptions")) {
    const newMap = {} as MapOfMultiplierOptions;
    loadedCatalog.$jazz.set("multiplierOptions", newMap);
  }

  const multiplierOptions = loadedCatalog.multiplierOptions;
  if (!multiplierOptions) {
    throw new Error("Failed to initialize multiplierOptions");
  }

  let created = 0;
  let updated = 0;

  for (const opt of options) {
    const exists = multiplierOptions.$jazz.has(opt.name);

    const newOption = MultiplierOption.create(
      {
        name: opt.name,
        disp: opt.disp,
        type: "multiplier",
        value: opt.value,
      },
      { owner: multiplierOptions.$jazz.owner },
    );

    // Set optional fields
    if (opt.seq !== undefined) newOption.$jazz.set("seq", opt.seq);
    if (opt.icon) newOption.$jazz.set("icon", opt.icon);
    if (opt.based_on) newOption.$jazz.set("based_on", opt.based_on);
    if (opt.scope)
      newOption.$jazz.set(
        "scope",
        opt.scope as "player" | "team" | "hole" | "rest_of_nine" | "game",
      );
    if (opt.availability) newOption.$jazz.set("availability", opt.availability);

    multiplierOptions.$jazz.set(opt.name, newOption);

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
      game: { created: 0, updated: 0 },
      junk: { created: 0, updated: 0 },
      multiplier: { created: 0, updated: 0 },
    },
    errors: [],
  };

  // Collect all unique options across all specs
  const allGameOptions = new Map<
    string,
    {
      name: string;
      disp: string;
      valueType: "bool" | "num" | "menu" | "text";
      defaultValue: string;
      choices?: Array<{ name: string; disp: string }>;
    }
  >();
  const allJunkOptions = new Map<
    string,
    {
      name: string;
      disp: string;
      type: string;
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
  >();
  const allMultiplierOptions = new Map<
    string,
    {
      name: string;
      disp: string;
      value: number;
      seq?: number;
      icon?: string;
      based_on?: string;
      scope?: string;
      availability?: string;
    }
  >();

  // First pass: Import specs and collect options
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

      const { created, updated } = await upsertGameSpec(catalog, spec);

      if (created) {
        result.specs.created++;
      } else if (updated) {
        result.specs.updated++;
      } else {
        result.specs.skipped++;
      }

      // Collect game options
      if (spec.options && spec.options.length > 0) {
        for (const opt of spec.options) {
          if (!allGameOptions.has(opt.name)) {
            // Map v0.3 type names to new valueType names
            let valueType: "bool" | "num" | "menu" | "text" = "num";
            if (opt.type === "bool") valueType = "bool";
            else if (opt.type === "menu") valueType = "menu";
            else if (opt.type === "text") valueType = "text";
            else if (opt.type === "pct") valueType = "num";
            else if (opt.type === "num") valueType = "num";

            allGameOptions.set(opt.name, {
              name: opt.name,
              disp: opt.disp,
              valueType,
              defaultValue: String(opt.default ?? ""),
              choices: opt.choices,
            });
          }
        }
      }

      // Collect junk options
      if (spec.junk && spec.junk.length > 0) {
        for (const junk of spec.junk) {
          if (!allJunkOptions.has(junk.name)) {
            allJunkOptions.set(junk.name, {
              name: junk.name,
              disp: junk.disp,
              type: junk.type,
              value: junk.value,
              seq: junk.seq as number | undefined,
              scope: junk.scope as string | undefined,
              icon: junk.icon as string | undefined,
              show_in: junk.show_in as string | undefined,
              based_on: junk.based_on as string | undefined,
              limit: junk.limit as string | undefined,
              calculation: junk.calculation as string | undefined,
              logic: junk.logic as string | undefined,
              better: junk.better as string | undefined,
              score_to_par: junk.score_to_par as string | undefined,
            });
          }
        }
      }

      // Collect multiplier options
      if (spec.multipliers && spec.multipliers.length > 0) {
        for (const mult of spec.multipliers) {
          if (!allMultiplierOptions.has(mult.name)) {
            allMultiplierOptions.set(mult.name, {
              name: mult.name,
              disp: mult.disp,
              value: mult.value,
              seq: mult.seq as number | undefined,
              icon: mult.icon as string | undefined,
              based_on: mult.based_on as string | undefined,
              scope: mult.scope as string | undefined,
              availability: mult.availability as string | undefined,
            });
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
  console.log(`Importing ${allGameOptions.size} game options...`);
  try {
    const gameResult = await upsertGameOptions(
      catalog,
      Array.from(allGameOptions.values()),
    );
    result.options.game = gameResult;
  } catch (error) {
    result.errors.push({
      item: "options:game",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  console.log(`Importing ${allJunkOptions.size} junk options...`);
  try {
    const junkResult = await upsertJunkOptions(
      catalog,
      Array.from(allJunkOptions.values()),
    );
    result.options.junk = junkResult;
  } catch (error) {
    result.errors.push({
      item: "options:junk",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  console.log(`Importing ${allMultiplierOptions.size} multiplier options...`);
  try {
    const multResult = await upsertMultiplierOptions(
      catalog,
      Array.from(allMultiplierOptions.values()),
    );
    result.options.multiplier = multResult;
  } catch (error) {
    result.errors.push({
      item: "options:multiplier",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return result;
}
