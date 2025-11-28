/**
 * GameCatalog Management Utilities (API Server)
 *
 * Implements catalog CRUD operations for the worker account.
 * Handles idempotent imports from ArangoDB and JSON sources.
 */

import type { co } from "jazz-tools";

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

import {
  ChoiceMap,
  ChoicesList,
  type GameCatalog,
  GameOption,
  GameSpec,
  JunkOption,
  type MapOfGameSpecs,
  type MapOfOptions,
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
    created: number;
    updated: number;
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
  catalog: GameCatalog,
  options: OptionData[],
): Promise<{ created: number; updated: number }> {
  const loadedCatalog = await catalog.$jazz.ensureLoaded({
    resolve: { options: {} },
  });

  // Initialize options map if it doesn't exist
  if (!loadedCatalog.$jazz.has("options")) {
    const newMap = {} as MapOfOptions;
    loadedCatalog.$jazz.set("options", newMap);
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

      // Collect game options
      if (spec.options && spec.options.length > 0) {
        for (const opt of spec.options) {
          if (!allOptions.has(opt.name)) {
            // Map v0.3 type names to new valueType names
            let valueType: "bool" | "num" | "menu" | "text" = "num";
            if (opt.type === "bool") valueType = "bool";
            else if (opt.type === "menu") valueType = "menu";
            else if (opt.type === "text") valueType = "text";
            else if (opt.type === "pct") valueType = "num";
            else if (opt.type === "num") valueType = "num";

            allOptions.set(opt.name, {
              type: "game",
              name: opt.name,
              disp: opt.disp,
              version: String(spec.version),
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
          if (!allOptions.has(junk.name)) {
            allOptions.set(junk.name, {
              type: "junk",
              name: junk.name,
              disp: junk.disp,
              version: String(spec.version),
              sub_type: junk.type as string | undefined,
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
          if (!allOptions.has(mult.name)) {
            allOptions.set(mult.name, {
              type: "multiplier",
              name: mult.name,
              disp: mult.disp,
              version: String(spec.version),
              sub_type: mult.sub_type as string | undefined,
              value: mult.value,
              seq: mult.seq as number | undefined,
              icon: mult.icon as string | undefined,
              based_on: mult.based_on as string | undefined,
              scope: mult.scope as string | undefined,
              availability: mult.availability as string | undefined,
              override: mult.override as boolean | undefined,
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
  console.log(`Importing ${allOptions.size} total options...`);
  try {
    const optionsResult = await upsertOptions(
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

  return result;
}
