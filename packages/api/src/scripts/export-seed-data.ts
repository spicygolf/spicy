/**
 * Export Game Specs and Options from ArangoDB to JSON seed files
 *
 * This is a one-time migration script to export v0.3 data from ArangoDB
 * into versioned JSON files that ship with the app.
 *
 * Run with: bun run packages/api/src/scripts/export-seed-data.ts
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  createArangoConnection,
  defaultConfig,
  fetchGameSpecs,
  type GameSpecV03,
} from "../utils/arango";

const SEED_PATH = join(process.cwd(), "../../data/seed");
const SPECS_PATH = join(SEED_PATH, "specs");
const OPTIONS_PATH = join(SEED_PATH, "options");

/**
 * Track legacy keys for consolidated specs
 */
const LEGACY_KEY_MAP = new Map<string, string[]>();

/**
 * Consolidate Match Play specs before export
 */
function consolidateMatchPlaySpecs(specs: GameSpecV03[]): GameSpecV03[] {
  const individualMatchPlay = specs.find(
    (s) => s.disp === "Individual Match Play",
  );
  const teamMatchPlay = specs.find((s) => s.disp === "Team Match Play");

  if (!individualMatchPlay || !teamMatchPlay) {
    return specs.filter((s) => s.disp !== "Team Match Play");
  }

  console.log(
    "Consolidating Individual Match Play + Team Match Play → Match Play",
  );

  const individualOptions = individualMatchPlay.options || [];
  const teamOptions = teamMatchPlay.options || [];

  const existingOptionNames = new Set(individualOptions.map((o) => o.name));
  const mergedOptions = [...individualOptions];

  for (const opt of teamOptions) {
    if (!existingOptionNames.has(opt.name)) {
      console.log(`  Adding option from Team Match Play: ${opt.name}`);
      mergedOptions.push(opt);
    }
  }

  // Track legacy keys - games referencing either individual or team match play
  // should resolve to the consolidated matchplay spec
  const legacyKeys: string[] = [];
  if (individualMatchPlay._key) legacyKeys.push(individualMatchPlay._key);
  if (teamMatchPlay._key) legacyKeys.push(teamMatchPlay._key);
  LEGACY_KEY_MAP.set("matchplay", legacyKeys);
  console.log(`  Legacy keys for matchplay: ${legacyKeys.join(", ")}`);

  const consolidatedMatchPlay: GameSpecV03 = {
    ...individualMatchPlay,
    _key: "matchplay", // New canonical key
    name: "matchplay",
    disp: "Match Play",
    max_players: Math.max(
      individualMatchPlay.max_players || 2,
      teamMatchPlay.max_players || 4,
    ),
    options: mergedOptions,
  };

  return specs
    .filter(
      (s) => s.disp !== "Individual Match Play" && s.disp !== "Team Match Play",
    )
    .concat(consolidatedMatchPlay);
}

/**
 * Get legacy keys for a spec (for consolidated specs)
 */
function getLegacyKeys(specName: string): string[] | undefined {
  return LEGACY_KEY_MAP.get(specName);
}

/**
 * Extract unique options from all specs
 */
interface OptionData {
  name: string;
  disp: string;
  type: "game" | "junk" | "multiplier";
  // Game options
  valueType?: "bool" | "num" | "menu" | "text" | "pct";
  defaultValue?: string;
  choices?: Array<{ name: string; disp: string }>;
  // Junk/Multiplier options
  sub_type?: string;
  value?: number;
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
  availability?: string;
  override?: boolean;
}

function extractOptions(specs: GameSpecV03[]): Map<string, OptionData> {
  const options = new Map<string, OptionData>();

  for (const spec of specs) {
    // Game options
    if (spec.options) {
      for (const opt of spec.options) {
        if (!options.has(opt.name)) {
          options.set(opt.name, {
            name: opt.name,
            disp: opt.disp,
            type: "game",
            valueType: opt.type as "bool" | "num" | "menu" | "text" | "pct",
            defaultValue: String(opt.default),
            choices: opt.choices,
          });
        }
      }
    }

    // Junk options
    if (spec.junk) {
      for (const junk of spec.junk) {
        if (!options.has(junk.name)) {
          options.set(junk.name, {
            name: junk.name,
            disp: junk.disp,
            type: "junk",
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

    // Multiplier options
    if (spec.multipliers) {
      for (const mult of spec.multipliers) {
        if (!options.has(mult.name)) {
          options.set(mult.name, {
            name: mult.name,
            disp: mult.disp,
            type: "multiplier",
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
  }

  return options;
}

/**
 * Create a clean spec for export (remove internal fields, reference options by name)
 */
interface ExportedSpec {
  _key: string; // ArangoDB _key for legacyId matching during game import
  legacy_keys?: string[]; // Additional legacy keys that should map to this spec
  name: string;
  disp: string;
  version: number;
  status: string;
  type: string;
  min_players: number;
  max_players?: number;
  location_type: string;
  long_description?: string;
  // Team configuration
  teams?: boolean;
  team_size?: number;
  team_change_every?: number;
  // Options referenced by name
  options: string[];
  junk: string[];
  multipliers: string[];
}

function createExportedSpec(
  spec: GameSpecV03,
  legacyKeys?: string[],
): ExportedSpec {
  const exported: ExportedSpec = {
    _key: spec._key || spec.name, // Use _key if available, fallback to name
    name: spec.name,
    disp: spec.disp,
    version: spec.version,
    status: spec.status,
    type: spec.type,
    min_players: spec.min_players,
    max_players: spec.max_players,
    location_type: spec.location_type,
    long_description: spec.long_description,
    teams: spec.teams,
    team_size: spec.team_size,
    team_change_every: spec.team_change_every,
    // Reference options by name only
    options: (spec.options || []).map((o) => o.name),
    junk: (spec.junk || []).map((j) => j.name),
    multipliers: (spec.multipliers || []).map((m) => m.name),
  };

  // Add legacy keys for consolidated specs (e.g., Match Play)
  if (legacyKeys && legacyKeys.length > 0) {
    exported.legacy_keys = legacyKeys;
  }

  return exported;
}

async function main() {
  console.log("Exporting seed data from ArangoDB...\n");

  // Ensure directories exist
  await mkdir(SPECS_PATH, { recursive: true });
  await mkdir(OPTIONS_PATH, { recursive: true });

  // Connect to ArangoDB
  const db = createArangoConnection(defaultConfig);

  // Fetch all specs
  console.log("Fetching game specs from ArangoDB...");
  const rawSpecs = await fetchGameSpecs(db);
  console.log(`  Found ${rawSpecs.length} specs`);

  // Consolidate Match Play
  const specs = consolidateMatchPlaySpecs(rawSpecs);
  console.log(`  After consolidation: ${specs.length} specs\n`);

  // Extract all unique options
  console.log("Extracting options from specs...");
  const options = extractOptions(specs);
  console.log(`  Found ${options.size} unique options\n`);

  // Write options to individual files
  console.log("Writing options to seed files...");
  for (const [name, option] of options) {
    // Clean up undefined values
    const cleanOption = JSON.parse(JSON.stringify(option));
    const filename = `${name}.json`;
    await writeFile(
      join(OPTIONS_PATH, filename),
      `${JSON.stringify(cleanOption, null, 2)}\n`,
    );
    console.log(`  ${filename}`);
  }

  // Write specs to individual files
  console.log("\nWriting specs to seed files...");
  for (const spec of specs) {
    const legacyKeys = getLegacyKeys(spec.name);
    const exportedSpec = createExportedSpec(spec, legacyKeys);
    // Clean up undefined values
    const cleanSpec = JSON.parse(JSON.stringify(exportedSpec));
    const filename = `${spec.name}.json`;
    await writeFile(
      join(SPECS_PATH, filename),
      `${JSON.stringify(cleanSpec, null, 2)}\n`,
    );
    console.log(`  ${filename}`);
  }

  // Write an index file for easy loading
  const index = {
    specs: specs.map((s) => s.name),
    options: Array.from(options.keys()),
    exportedAt: new Date().toISOString(),
    version: "1.0.0",
  };
  await writeFile(
    join(SEED_PATH, "index.json"),
    `${JSON.stringify(index, null, 2)}\n`,
  );
  console.log("\nWrote index.json");

  console.log("\nExport complete!");
  console.log(`  Specs: ${specs.length}`);
  console.log(`  Options: ${options.size}`);
}

main().catch(console.error);
