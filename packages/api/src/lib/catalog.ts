/**
 * GameCatalog Management Utilities (API Server)
 *
 * Implements catalog CRUD operations for the worker account.
 * Handles idempotent imports from ArangoDB and JSON sources.
 */

import type { co } from "jazz-tools";
import {
  type GameCatalog,
  GameSpec,
  type MapOfGameSpecs,
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
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ spec: string; error: string }>;
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
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (const spec of allSpecs) {
    try {
      // Validate all required fields before creating GameSpec
      if (!spec.disp || !spec.version || !spec.type || !spec.status) {
        result.skipped++;
        result.errors.push({
          spec: spec.name || spec._key || "unknown",
          error: "Missing required fields (disp, version, type, or status)",
        });
        continue;
      }

      // Validate numeric fields
      if (typeof spec.min_players !== "number" || spec.min_players < 1) {
        result.skipped++;
        result.errors.push({
          spec: spec.name || spec._key || "unknown",
          error: "Invalid min_players: must be a number >= 1",
        });
        continue;
      }

      // Validate location_type
      if (!spec.location_type || typeof spec.location_type !== "string") {
        result.skipped++;
        result.errors.push({
          spec: spec.name || spec._key || "unknown",
          error: "Invalid location_type: must be a non-empty string",
        });
        continue;
      }

      const { created, updated } = await upsertGameSpec(catalog, spec);

      if (created) {
        result.created++;
      } else if (updated) {
        result.updated++;
      } else {
        result.skipped++;
      }
    } catch (error) {
      result.errors.push({
        spec: spec.disp || spec.name || spec._key || "unknown",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}
