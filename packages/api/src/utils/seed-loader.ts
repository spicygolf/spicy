/**
 * Seed Data Loader
 *
 * Loads game specs and options from JSON seed files in data/seed/.
 * This replaces ArangoDB as the source of truth for spec/option definitions.
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

// Path to seed data (relative to api package)
const SEED_PATH = join(process.cwd(), "../../data/seed");
const SPECS_PATH = join(SEED_PATH, "specs");
const OPTIONS_PATH = join(SEED_PATH, "options");
const MESSAGES_PATH = join(SEED_PATH, "messages");

/**
 * Seed data option types (v0.5 format)
 */
export interface SeedGameOption {
  name: string;
  disp: string;
  type: "game";
  valueType: "bool" | "num" | "menu" | "text" | "pct";
  defaultValue: string;
  choices?: Array<{ name: string; disp: string }>;
  teamOnly?: boolean;
}

export interface SeedJunkOption {
  name: string;
  disp: string;
  type: "junk";
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

export interface SeedMultiplierOption {
  name: string;
  disp: string;
  type: "multiplier";
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

export type SeedOption = SeedGameOption | SeedJunkOption | SeedMultiplierOption;

/**
 * Option reference: either a name (string) or an object with name + overrides
 * When an object, any fields besides "name" override the base option values.
 *
 * Examples:
 *   "birdie"                        - use birdie option as-is
 *   { "name": "low_ball", "value": 2 } - use low_ball but override value to 2
 */
export type OptionRef = string | { name: string; [key: string]: unknown };

/**
 * Seed data spec format (references options by name, with optional overrides)
 */
export interface SeedSpec {
  _key: string; // ArangoDB _key for legacyId matching during game import
  legacy_keys?: string[]; // Additional legacy keys (for consolidated specs like Match Play)
  name: string;
  disp: string;
  version: number;
  status: string;
  type: string;
  min_players: number;
  max_players?: number;
  location_type: string;
  long_description?: string;
  teams?: boolean;
  team_size?: number;
  team_change_every?: number;
  options: OptionRef[]; // Game option names or objects with overrides
  junk: OptionRef[]; // Junk option names or objects with overrides
  multipliers: OptionRef[]; // Multiplier option names or objects with overrides
}

/**
 * Seed index file format
 */
interface SeedIndex {
  specs: string[];
  options: string[];
  exportedAt: string;
  version: string;
}

/**
 * Load a single JSON file
 */
async function loadJsonFile<T>(filepath: string): Promise<T> {
  const content = await readFile(filepath, "utf-8");
  return JSON.parse(content) as T;
}

/**
 * Load all options from seed files
 */
export async function loadSeedOptions(): Promise<Map<string, SeedOption>> {
  const options = new Map<string, SeedOption>();

  try {
    const files = await readdir(OPTIONS_PATH);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    for (const filename of jsonFiles) {
      try {
        const option = await loadJsonFile<SeedOption>(
          join(OPTIONS_PATH, filename),
        );
        options.set(option.name, option);
      } catch (error) {
        console.warn(`Failed to load option ${filename}:`, error);
      }
    }

    console.log(`Loaded ${options.size} options from seed files`);
  } catch (error) {
    console.error("Failed to read options directory:", error);
  }

  return options;
}

/**
 * Load all specs from seed files
 */
export async function loadSeedSpecs(): Promise<SeedSpec[]> {
  const specs: SeedSpec[] = [];

  try {
    const files = await readdir(SPECS_PATH);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    for (const filename of jsonFiles) {
      try {
        const spec = await loadJsonFile<SeedSpec>(join(SPECS_PATH, filename));
        specs.push(spec);
      } catch (error) {
        console.warn(`Failed to load spec ${filename}:`, error);
      }
    }

    console.log(`Loaded ${specs.length} specs from seed files`);
  } catch (error) {
    console.error("Failed to read specs directory:", error);
  }

  return specs;
}

/**
 * Load seed index
 */
export async function loadSeedIndex(): Promise<SeedIndex | null> {
  try {
    return await loadJsonFile<SeedIndex>(join(SEED_PATH, "index.json"));
  } catch (error) {
    console.warn("Failed to load seed index:", error);
    return null;
  }
}

/**
 * Parse an option reference and return the name and any overrides
 */
function parseOptionRef(ref: OptionRef): {
  name: string;
  overrides: Record<string, unknown>;
} {
  if (typeof ref === "string") {
    return { name: ref, overrides: {} };
  }
  const { name, ...overrides } = ref;
  return { name, overrides };
}

/**
 * Convert seed spec to GameSpecV03 format for compatibility with existing import code
 *
 * This bridges the gap between the new seed format and the existing catalog import code.
 * Supports per-spec overrides: { "name": "low_ball", "value": 2 } merges onto base option.
 */
export async function loadSeedSpecsAsV03(): Promise<
  Array<{
    _key?: string;
    legacy_keys?: string[]; // Additional legacy keys (for consolidated specs like Match Play)
    name: string;
    disp: string;
    version: number;
    status: string;
    type: string;
    min_players: number;
    max_players?: number;
    location_type: string;
    long_description?: string;
    teams?: boolean;
    team_size?: number;
    team_change_every?: number;
    options?: Array<{
      name: string;
      disp: string;
      type: string;
      default: string | number | boolean;
      choices?: Array<{ name: string; disp: string }>;
      teamOnly?: boolean;
    }>;
    junk?: Array<{
      name: string;
      disp: string;
      type?: string;
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
    }>;
    multipliers?: Array<{
      name: string;
      disp: string;
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
    }>;
  }>
> {
  const [specs, optionsMap] = await Promise.all([
    loadSeedSpecs(),
    loadSeedOptions(),
  ]);

  return specs.map((spec) => {
    // Resolve option references to full option data, merging any per-spec overrides
    const gameOptions = spec.options
      .map((ref) => {
        const { name, overrides } = parseOptionRef(ref);
        const opt = optionsMap.get(name);
        if (!opt || opt.type !== "game") return null;
        return {
          name: opt.name,
          disp: opt.disp,
          type: opt.valueType,
          default:
            opt.valueType === "bool"
              ? opt.defaultValue === "true"
              : opt.valueType === "num" || opt.valueType === "pct"
                ? Number(opt.defaultValue)
                : opt.defaultValue,
          choices: opt.choices,
          teamOnly: opt.teamOnly,
          ...overrides, // Apply per-spec overrides
        };
      })
      .filter(Boolean);

    const junkOptions = spec.junk
      .map((ref) => {
        const { name, overrides } = parseOptionRef(ref);
        const opt = optionsMap.get(name);
        if (!opt || opt.type !== "junk") return null;
        return {
          name: opt.name,
          disp: opt.disp,
          type: opt.sub_type,
          value: opt.value,
          seq: opt.seq,
          scope: opt.scope,
          icon: opt.icon,
          show_in: opt.show_in,
          based_on: opt.based_on,
          limit: opt.limit,
          calculation: opt.calculation,
          logic: opt.logic,
          better: opt.better,
          score_to_par: opt.score_to_par,
          ...overrides, // Apply per-spec overrides
        };
      })
      .filter(Boolean);

    const multiplierOptions = spec.multipliers
      .map((ref) => {
        const { name, overrides } = parseOptionRef(ref);
        const opt = optionsMap.get(name);
        if (!opt || opt.type !== "multiplier") return null;
        return {
          name: opt.name,
          disp: opt.disp,
          sub_type: opt.sub_type,
          value: opt.value,
          seq: opt.seq,
          icon: opt.icon,
          based_on: opt.based_on,
          scope: opt.scope,
          availability: opt.availability,
          override: opt.override,
          input_value: opt.input_value,
          value_from: opt.value_from,
          ...overrides, // Apply per-spec overrides
        };
      })
      .filter(Boolean);

    return {
      _key: spec._key, // ArangoDB _key for legacyId matching during game import
      legacy_keys: spec.legacy_keys, // Additional legacy keys (for consolidated specs like Match Play)
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
      options: gameOptions as Array<{
        name: string;
        disp: string;
        type: string;
        default: string | number | boolean;
        choices?: Array<{ name: string; disp: string }>;
      }>,
      junk: junkOptions as Array<{
        name: string;
        disp: string;
        type?: string;
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
      multipliers: multiplierOptions as Array<{
        name: string;
        disp: string;
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
      }>,
    };
  });
}

/**
 * Seed message file format
 */
export interface SeedMessageFile {
  locale: string;
  messages: Array<{ key: string; message: string }>;
}

/**
 * Load all error messages from seed files
 *
 * Reads all JSON files from data/seed/messages/ directory.
 * Each file should contain a locale and array of messages.
 *
 * @returns Map of locale code to SeedMessageFile
 */
export async function loadSeedMessages(): Promise<
  Map<string, SeedMessageFile>
> {
  const messages = new Map<string, SeedMessageFile>();

  try {
    const files = await readdir(MESSAGES_PATH);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    for (const filename of jsonFiles) {
      try {
        const messageFile = await loadJsonFile<SeedMessageFile>(
          join(MESSAGES_PATH, filename),
        );
        messages.set(messageFile.locale, messageFile);
      } catch (error) {
        console.warn(`Failed to load messages ${filename}:`, error);
      }
    }

    console.log(`Loaded ${messages.size} message locales from seed files`);
  } catch (error) {
    console.error("Failed to read messages directory:", error);
  }

  return messages;
}
