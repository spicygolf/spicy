/**
 * Spec Loader
 *
 * Loads game specs and options from data/seed/ directory.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// =============================================================================
// Types
// =============================================================================

/**
 * Raw spec data from data/seed/specs/*.json
 */
export interface RawSpec {
  name: string;
  disp: string;
  version: number;
  status: string;
  type: string;
  min_players: number;
  max_players?: number;
  location_type: string;
  teams?: boolean;
  team_size?: number;
  team_change_every?: number;
  options?: string[];
  junk?: Array<string | { name: string; value: number }>;
  multipliers?: string[];
  long_description?: string;
}

/**
 * Raw option data from data/seed/options/*.json
 */
export interface RawOption {
  name: string;
  disp: string;
  type: "game" | "junk" | "multiplier";
  // Common fields
  value?: number;
  seq?: number;
  icon?: string;
  // Game option fields
  valueType?: "bool" | "num" | "menu" | "text" | "pct";
  defaultValue?: string | number;
  // Junk option fields
  sub_type?: string;
  scope?: string;
  show_in?: string;
  based_on?: string;
  limit?: string | null;
  score_to_par?: string;
  calculation?: string;
  better?: string;
  logic?: string;
  // Multiplier option fields
  availability?: string;
  override?: boolean;
  value_from?: string;
  input_value?: boolean;
}

/**
 * Loaded spec with resolved options
 */
export interface LoadedSpec {
  name: string;
  disp: string;
  version: number;
  status: string;
  type: string;
  min_players: number;
  max_players?: number;
  location_type: string;
  teams?: boolean;
  team_size?: number;
  team_change_every?: number;
  options: Map<string, LoadedOption>;
}

/**
 * Loaded option with all fields normalized
 */
export interface LoadedOption {
  name: string;
  disp: string;
  type: "game" | "junk" | "multiplier";
  // Common
  value?: number;
  seq?: number;
  // Game option
  valueType?: "bool" | "num" | "menu" | "text";
  defaultValue?: string;
  // Junk option
  scope?: string;
  based_on?: string;
  score_to_par?: string;
  calculation?: string;
  logic?: string;
  limit?: string;
  better?: string;
  // Multiplier option
  sub_type?: string;
  availability?: string;
  override?: boolean;
  value_from?: string;
}

// =============================================================================
// Path Resolution
// =============================================================================

/**
 * Find the project root by looking for package.json
 */
function findProjectRoot(): string {
  // Start from current working directory and look for data/seed
  let dir = process.cwd();

  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, "data", "seed", "specs"))) {
      return dir;
    }
    const parent = join(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }

  throw new Error("Could not find project root with data/seed directory");
}

const PROJECT_ROOT = findProjectRoot();
const SEED_DIR = join(PROJECT_ROOT, "data", "seed");
const SPECS_DIR = join(SEED_DIR, "specs");
const OPTIONS_DIR = join(SEED_DIR, "options");

// =============================================================================
// Caches
// =============================================================================

const specCache = new Map<string, RawSpec>();
const optionCache = new Map<string, RawOption>();

/**
 * Clear all caches (useful for testing)
 */
export function clearSpecCache(): void {
  specCache.clear();
  optionCache.clear();
}

// =============================================================================
// Raw Loaders
// =============================================================================

/**
 * Load a raw spec from disk
 */
function loadRawSpec(specName: string): RawSpec {
  if (specCache.has(specName)) {
    return specCache.get(specName)!;
  }

  const specPath = join(SPECS_DIR, `${specName}.json`);
  if (!existsSync(specPath)) {
    throw new Error(`Spec not found: ${specName} (expected at ${specPath})`);
  }

  const content = readFileSync(specPath, "utf-8");
  const spec = JSON.parse(content) as RawSpec;
  specCache.set(specName, spec);
  return spec;
}

/**
 * Load a raw option from disk
 */
function loadRawOption(optionName: string): RawOption {
  if (optionCache.has(optionName)) {
    return optionCache.get(optionName)!;
  }

  const optionPath = join(OPTIONS_DIR, `${optionName}.json`);
  if (!existsSync(optionPath)) {
    throw new Error(
      `Option not found: ${optionName} (expected at ${optionPath})`,
    );
  }

  const content = readFileSync(optionPath, "utf-8");
  const option = JSON.parse(content) as RawOption;
  optionCache.set(optionName, option);
  return option;
}

// =============================================================================
// Option Processing
// =============================================================================

/**
 * Convert raw option to loaded option with normalized fields
 */
function processRawOption(raw: RawOption): LoadedOption {
  const loaded: LoadedOption = {
    name: raw.name,
    disp: raw.disp,
    type: raw.type,
  };

  // Common fields
  if (raw.value !== undefined) {
    loaded.value = raw.value;
  }
  if (raw.seq !== undefined) {
    loaded.seq = raw.seq;
  }

  // Type-specific fields
  if (raw.type === "game") {
    // Normalize valueType (pct -> num)
    let valueType = raw.valueType;
    if (valueType === "pct") {
      valueType = "num";
    }
    loaded.valueType = valueType as "bool" | "num" | "menu" | "text";

    // Normalize defaultValue to string
    if (raw.defaultValue !== undefined) {
      loaded.defaultValue = String(raw.defaultValue);
    }
  }

  if (raw.type === "junk") {
    if (raw.scope) loaded.scope = raw.scope;
    if (raw.based_on) loaded.based_on = raw.based_on;
    if (raw.score_to_par) loaded.score_to_par = raw.score_to_par;
    if (raw.calculation) loaded.calculation = raw.calculation;
    if (raw.logic) loaded.logic = raw.logic;
    if (raw.limit) loaded.limit = raw.limit;
    if (raw.better) loaded.better = raw.better;
  }

  if (raw.type === "multiplier") {
    if (raw.sub_type) loaded.sub_type = raw.sub_type;
    if (raw.scope) loaded.scope = raw.scope;
    if (raw.based_on) loaded.based_on = raw.based_on;
    if (raw.availability) loaded.availability = raw.availability;
    if (raw.override !== undefined) loaded.override = raw.override;
    if (raw.value_from) loaded.value_from = raw.value_from;
  }

  return loaded;
}

// =============================================================================
// Main Loader
// =============================================================================

/**
 * Load a game spec with all its options resolved
 *
 * Options are loaded from:
 * 1. spec.options (game options like use_handicaps, stakes)
 * 2. spec.junk (junk options like birdie, prox, low_ball)
 * 3. spec.multipliers (multiplier options like double, pre_double)
 *
 * Junk entries can be:
 * - String: reference to option file (e.g., "birdie")
 * - Object: reference with value override (e.g., { name: "low_ball", value: 2 })
 */
export function loadSpec(specName: string): LoadedSpec {
  const raw = loadRawSpec(specName);
  const options = new Map<string, LoadedOption>();

  // Load game options
  if (raw.options) {
    for (const optionName of raw.options) {
      const rawOption = loadRawOption(optionName);
      options.set(optionName, processRawOption(rawOption));
    }
  }

  // Load junk options
  if (raw.junk) {
    for (const junkEntry of raw.junk) {
      if (typeof junkEntry === "string") {
        // Simple reference
        const rawOption = loadRawOption(junkEntry);
        options.set(junkEntry, processRawOption(rawOption));
      } else {
        // Reference with value override
        const rawOption = loadRawOption(junkEntry.name);
        const processed = processRawOption(rawOption);
        processed.value = junkEntry.value; // Apply override
        options.set(junkEntry.name, processed);
      }
    }
  }

  // Load multiplier options
  if (raw.multipliers) {
    for (const multName of raw.multipliers) {
      const rawOption = loadRawOption(multName);
      options.set(multName, processRawOption(rawOption));
    }
  }

  return {
    name: raw.name,
    disp: raw.disp,
    version: raw.version,
    status: raw.status,
    type: raw.type,
    min_players: raw.min_players,
    max_players: raw.max_players,
    location_type: raw.location_type,
    teams: raw.teams,
    team_size: raw.team_size,
    team_change_every: raw.team_change_every,
    options,
  };
}

/**
 * Load a single option by name
 */
export function loadOption(optionName: string): LoadedOption {
  const raw = loadRawOption(optionName);
  return processRawOption(raw);
}

/**
 * Get all option names from a spec
 */
export function getSpecOptionNames(specName: string): string[] {
  const raw = loadRawSpec(specName);
  const names: string[] = [];

  if (raw.options) {
    names.push(...raw.options);
  }

  if (raw.junk) {
    for (const entry of raw.junk) {
      if (typeof entry === "string") {
        names.push(entry);
      } else {
        names.push(entry.name);
      }
    }
  }

  if (raw.multipliers) {
    names.push(...raw.multipliers);
  }

  return names;
}
