/**
 * GameCatalog Management Utilities
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
 *
 * The catalog is automatically created during account migration.
 * If the catalog doesn't exist, the worker account needs to be reset.
 */
export async function loadOrCreateCatalog(
  workerAccount: co.loaded<typeof PlayerAccount>,
): Promise<GameCatalog> {
  // Load profile with catalog
  const loadedAccount = await workerAccount.$jazz.ensureLoaded({
    resolve: { profile: { catalog: true } },
  });

  if (!loadedAccount.profile) {
    throw new Error("Worker account has no profile");
  }

  const profile = loadedAccount.profile;

  // Check if catalog exists using Jazz pattern
  if (!profile.$jazz.has("catalog")) {
    throw new Error(
      "Worker account catalog not initialized. The worker account was created with an older schema version. " +
        "To fix this, delete the worker account data from IndexedDB (Application > Storage > IndexedDB) and refresh the page.",
    );
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
 * Uses map key format "name-version" for automatic deduplication.
 * Always replaces the existing spec with the new data.
 */
export async function upsertGameSpec(
  catalog: GameCatalog,
  specData: GameSpecV03,
): Promise<{ created: boolean; updated: boolean }> {
  // Ensure catalog with specs is loaded
  const loadedCatalog = await catalog.$jazz.ensureLoaded({
    resolve: { specs: {} },
  });

  if (!loadedCatalog.specs) {
    throw new Error("Catalog specs is null");
  }

  const specs: MapOfGameSpecs = loadedCatalog.specs;

  // Create unique key from name and version
  const key = `${specData.disp}-${specData.version}`;

  // Check if spec already exists
  const exists = specs.$jazz.has(key);

  // Transform the data
  const transformed = transformGameSpec(specData);

  // Create the new spec
  const newSpec = GameSpec.create(
    {
      name: transformed.name,
      short: transformed.short,
      version: transformed.version,
      status: transformed.status,
      spec_type: transformed.spec_type,
      min_players: transformed.min_players,
      location_type: transformed.location_type,
    },
    { owner: specs.$jazz.owner },
  );

  // Set optional fields
  if (transformed.long_description) {
    newSpec.$jazz.set("long_description", transformed.long_description);
  }

  // Set in map (idempotent - will replace if exists)
  specs.$jazz.set(key, newSpec);

  return { created: !exists, updated: exists };
}

/**
 * Merge game specs from both ArangoDB and JSON sources
 * ArangoDB takes precedence on conflicts (same name + version)
 */
export async function mergeGameSpecSources(
  arangoConfig?: ArangoConfig,
): Promise<GameSpecV03[]> {
  // Load from both sources in parallel
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
    jsonSpecs.map((s) => s.disp),
  );
  console.log(
    "Loaded from ArangoDB:",
    arangoSpecs.length,
    arangoSpecs.map((s) => s.disp),
  );

  // Create map of specs by unique key (name + version)
  const specMap = new Map<string, GameSpecV03>();

  // Add JSON specs first
  for (const spec of jsonSpecs) {
    const key = `${spec.disp}-${spec.version}`;
    specMap.set(key, spec);
  }

  // Override with ArangoDB specs (they take precedence)
  for (const spec of arangoSpecs) {
    const key = `${spec.disp}-${spec.version}`;
    specMap.set(key, spec);
  }

  return Array.from(specMap.values());
}

/**
 * Import all game specs to the catalog (idempotent)
 *
 * Merges specs from ArangoDB and JSON, then upserts to catalog.
 * Safe to run multiple times - will skip unchanged specs.
 */
export async function importGameSpecsToCatalog(
  workerAccount: co.loaded<typeof PlayerAccount>,
  arangoConfig?: ArangoConfig,
): Promise<ImportResult> {
  console.log("Starting import to catalog for worker:", workerAccount.$jazz.id);

  // Load or create catalog
  const catalog = await loadOrCreateCatalog(workerAccount);
  console.log("Catalog loaded/created:", catalog.$jazz.id);

  // Merge sources
  const allSpecs = await mergeGameSpecSources(arangoConfig);
  console.log("Total specs to import:", allSpecs.length);

  // Track results
  const result: ImportResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  // Import each spec (idempotent)
  for (const spec of allSpecs) {
    try {
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
        spec: spec.disp,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}
