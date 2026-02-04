/**
 * Option Utilities
 *
 * Helpers for resolving option values with per-hole overrides.
 *
 * Architecture note:
 * - v0.3 used `values: [{ value, holes }]` on each option for per-hole values
 * - New architecture uses `GameHole.options: MapOfOptions` for per-hole overrides
 * - This helper merges both: check GameHole.options first, then fall back to game/spec options
 */

import type { Group } from "jazz-tools";
import {
  type Game,
  type GameHole,
  type GameOption,
  type GameSpec,
  type JunkOption,
  MapOfOptions,
  type MetaOption,
  type MultiplierOption,
  type Option,
} from "../schema";
import { deepClone } from "../utils/clone";
import type { ScoringContext } from "./types";

// =============================================================================
// Public API
// =============================================================================

/**
 * Get the value of an option for a specific hole.
 *
 * Resolution order:
 * 1. Check GameHole.options for this hole (per-hole override)
 * 2. Fall back to game/spec options (default value)
 *
 * This replaces v0.3's getOptionValue() and isOptionOnThisHole() functions.
 *
 * @param optionName - Name of the option to look up
 * @param holeNum - Hole number as string ("1" - "18")
 * @param ctx - Scoring context with game, options, and gameHoles
 * @returns The option value, or undefined if not found
 */
export function getOptionValueForHole(
  optionName: string,
  holeNum: string,
  ctx: ScoringContext,
): number | string | boolean | undefined {
  // 1. Check GameHole.options for this hole (per-hole override)
  const gameHole = ctx.gameHoles.find((h) => h.hole === holeNum);
  if (gameHole?.options?.$isLoaded) {
    const holeOption = gameHole.options[optionName];
    if (holeOption) {
      const value = extractOptionValue(holeOption);
      if (value !== undefined) {
        return value;
      }
    }
  }

  // 2. Fall back to game/spec options
  const option = ctx.options?.[optionName];
  if (option) {
    return extractOptionValue(option);
  }

  return undefined;
}

/**
 * Get the full option object for a hole (with per-hole override applied).
 *
 * @param optionName - Name of the option to look up
 * @param holeNum - Hole number as string
 * @param ctx - Scoring context
 * @returns The option object, or undefined if not found
 */
export function getOptionForHole(
  optionName: string,
  holeNum: string,
  ctx: ScoringContext,
): Option | undefined {
  // 1. Check GameHole.options for this hole
  const gameHole = ctx.gameHoles.find((h) => h.hole === holeNum);
  if (gameHole?.options?.$isLoaded) {
    const holeOption = gameHole.options[optionName];
    if (holeOption) {
      return holeOption;
    }
  }

  // 2. Fall back to game/spec options
  const option = ctx.options?.[optionName];
  if (option) {
    return option;
  }

  return undefined;
}

/**
 * Check if an option is active/applicable on a specific hole.
 *
 * This replaces v0.3's isOptionOnThisHole() function.
 * In the new architecture, options are always applicable unless:
 * - The option doesn't exist
 * - The option has been explicitly disabled for this hole
 *
 * @param optionName - Name of the option
 * @param holeNum - Hole number
 * @param ctx - Scoring context
 * @returns true if option is active on this hole
 */
export function isOptionOnHole(
  optionName: string,
  holeNum: string,
  ctx: ScoringContext,
): boolean {
  // In new architecture, if option exists it's active on all holes
  // Per-hole disabling would be done by setting value to 0 or false
  const option = getOptionForHole(optionName, holeNum, ctx);
  return option !== undefined;
}

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Extract the value from an Option based on its type.
 *
 * - GameOption: uses `value` (string) or `defaultValue`
 * - JunkOption: uses `value` (number)
 * - MultiplierOption: uses `value` (number)
 */
function extractOptionValue(
  option: Option,
): number | string | boolean | undefined {
  if (!option) {
    return undefined;
  }

  switch (option.type) {
    case "game": {
      const gameOpt = option as GameOption;
      const rawValue = gameOpt.value ?? gameOpt.defaultValue;
      if (rawValue === undefined) return undefined;

      // Convert based on valueType
      switch (gameOpt.valueType) {
        case "bool":
          return rawValue === "true";
        case "num":
          return Number.parseFloat(rawValue);
        default:
          return rawValue;
      }
    }
    case "junk": {
      const junkOpt = option as JunkOption;
      return junkOpt.value;
    }
    case "multiplier": {
      const multOpt = option as MultiplierOption;
      return multOpt.value;
    }
    default:
      return undefined;
  }
}

/**
 * Calculate the total pre_double multiplier value from the front nine.
 *
 * Used for the "Re Pre" option on hole 10 - allows carrying over accumulated
 * pre_double multipliers from the front nine to the back nine.
 *
 * @param ctx - Scoring context containing game holes
 * @returns The total pre_double value (e.g., 4 if two 2x pre_doubles), or 1 if none
 */
export function getFrontNinePreDoubleTotal(ctx: ScoringContext): number {
  const gameHoles = ctx.gameHoles;
  if (!gameHoles) return 1;
  return getFrontNinePreDoubleTotalFromHoles(gameHoles);
}

/**
 * Calculate the total pre_double multiplier value from the front nine.
 * This version takes GameHole[] directly for use in UI contexts without full ScoringContext.
 *
 * @param gameHoles - Array of game holes
 * @returns The total pre_double value (e.g., 4 if two 2x pre_doubles), or 1 if none
 */
export function getFrontNinePreDoubleTotalFromHoles(
  gameHoles: GameHole[],
): number {
  let total = 1; // Start at 1x (no multiplier)

  // Check holes 1-9 for pre_double options across ALL teams
  for (let holeNum = 1; holeNum <= 9; holeNum++) {
    const gameHole = gameHoles.find((h) => h.hole === String(holeNum));
    if (!gameHole?.teams?.$isLoaded) continue;

    for (const team of gameHole.teams) {
      if (!team?.$isLoaded) continue;
      if (!team.options?.$isLoaded) continue;

      for (const opt of team.options) {
        if (!opt?.$isLoaded) continue;
        // Look for pre_double options where firstHole matches this hole
        // (to avoid counting duplicates from old imported data)
        if (
          opt.optionName === "pre_double" &&
          opt.firstHole === String(holeNum)
        ) {
          // Each pre_double is worth 2x, multiply into total
          total *= 2;
        }
      }
    }
  }

  return total;
}

/**
 * Get all junk options that are active on a specific hole.
 *
 * @param holeNum - Hole number
 * @param ctx - Scoring context
 * @returns Array of JunkOption objects active on this hole
 */
export function getJunkOptionsForHole(
  holeNum: string,
  ctx: ScoringContext,
): JunkOption[] {
  const junkOptions: JunkOption[] = [];
  const options = ctx.options;

  if (!options) return junkOptions;

  for (const key of Object.keys(options)) {
    if (key.startsWith("$") || key === "_refs") continue;
    if (!options.$jazz.has(key)) continue;

    const opt = options[key];
    if (opt && opt.type === "junk") {
      // Check if there's a per-hole override
      const holeOption = getOptionForHole(key, holeNum, ctx);
      if (holeOption && holeOption.type === "junk") {
        junkOptions.push(holeOption as JunkOption);
      } else {
        junkOptions.push(opt as JunkOption);
      }
    }
  }

  // Sort by seq for consistent evaluation order
  return junkOptions.sort((a, b) => (a.seq ?? 999) - (b.seq ?? 999));
}

// =============================================================================
// Meta Option Helpers
// =============================================================================

/**
 * Get a meta option value from a GameSpec.
 *
 * Meta options store spec-level metadata like short name, aliases, status, etc.
 * This replaces direct access to deprecated top-level GameSpec fields.
 *
 * @param source - GameSpec to read from
 * @param optionName - Name of the meta option (e.g., "short", "aliases", "status")
 * @returns The meta option value, or undefined if not found
 *
 * @example
 * const shortName = getMetaOption(spec, "short"); // "5pts"
 * const aliases = getMetaOption(spec, "aliases"); // ["Scotch", "Umbrella"]
 * const status = getMetaOption(spec, "status"); // "prod"
 */
export function getMetaOption(
  spec: GameSpec | undefined | null,
  optionName: string,
): string | number | boolean | string[] | undefined {
  if (!spec?.$isLoaded) return undefined;

  // GameSpec IS the options map directly (no wrapper)
  // Check if option exists before accessing (Jazz CoMap pattern)
  // In tests, $jazz may not exist on mock objects
  if (spec.$jazz?.has && !spec.$jazz.has(optionName)) return undefined;
  const option = spec[optionName];
  if (!option || option.type !== "meta") return undefined;

  const metaOpt = option as MetaOption;

  // For text_array type, return the array value
  if (metaOpt.valueType === "text_array") {
    if (!metaOpt.valueArray) return undefined;
    return [...metaOpt.valueArray];
  }

  // For other types, parse the string value
  const rawValue = metaOpt.value;
  if (rawValue === undefined) return undefined;

  switch (metaOpt.valueType) {
    case "bool":
      return rawValue === "true";
    case "num":
      return Number.parseFloat(rawValue);
    default:
      return rawValue;
  }
}

/**
 * Get a spec field from the options map.
 *
 * GameSpec stores ALL data in the options map. This helper reads a value by name.
 *
 * @param spec - GameSpec to read from
 * @param fieldName - Field name (e.g., "name", "short", "status", "min_players")
 * @returns The field value from the options map
 */
export function getSpecField(
  spec: GameSpec | undefined | null,
  fieldName: string,
): string | number | boolean | string[] | undefined {
  if (!spec?.$isLoaded) return undefined;
  return getMetaOption(spec, fieldName);
}

/**
 * Get the effective options source for a game.
 *
 * Returns game.spec (the working copy of options).
 * Falls back to specRef if spec not populated (shouldn't happen in normal use).
 *
 * @param game - Game to get options from
 * @returns The options map or undefined
 */
export function getGameOptions(
  game: Game | undefined | null,
): ReturnType<typeof getOptionsFromGame> {
  return getOptionsFromGame(game);
}

function getOptionsFromGame(game: Game | undefined | null) {
  if (!game?.$isLoaded) return undefined;

  // Primary source: game.spec (working copy with user modifications)
  if (game.spec?.$isLoaded) {
    return game.spec;
  }

  // Fallback: specRef (catalog spec - shouldn't be needed in normal use)
  if (game.specRef?.$isLoaded) {
    return game.specRef;
  }

  return undefined;
}

/**
 * Copy all options from a source spec to a new MapOfOptions.
 *
 * This creates a deep copy of options so the game has its own independent
 * working copy that can be modified without affecting the catalog spec.
 *
 * Options are plain JSON objects (not CoMaps), so copying is simple:
 * just structuredClone each option into the new MapOfOptions.
 *
 * @param sourceSpec - The spec to copy options from (typically game.specRef)
 * @param owner - The Jazz Group that will own the new MapOfOptions
 * @returns A new MapOfOptions with copies of all options
 */
export function copySpecOptions(
  sourceSpec: GameSpec | MapOfOptions,
  owner: Group,
): MapOfOptions {
  const newSpec = MapOfOptions.create({}, { owner });

  if (!sourceSpec?.$isLoaded) {
    console.log("[copySpecOptions] sourceSpec not loaded, returning empty");
    return newSpec;
  }

  // Debug: Log available keys in source spec
  const allKeys = Object.keys(sourceSpec).filter(
    (k) => !k.startsWith("$") && k !== "_refs",
  );
  const hasKeys = allKeys.filter((k) => sourceSpec.$jazz.has(k));
  console.log("[copySpecOptions] Available keys:", allKeys.length, allKeys);
  console.log(
    "[copySpecOptions] Keys with $jazz.has:",
    hasKeys.length,
    hasKeys,
  );

  // Iterate over all options in source spec and deep-copy each one
  for (const key of Object.keys(sourceSpec)) {
    if (key.startsWith("$") || key === "_refs") continue;
    if (!sourceSpec.$jazz.has(key)) continue;

    const option = sourceSpec[key];
    if (!option) continue;

    // Options are plain JSON objects, so deep clone creates a copy
    newSpec.$jazz.set(key, deepClone(option));
  }

  console.log(
    "[copySpecOptions] Copied",
    hasKeys.length,
    "options to new spec",
  );
  return newSpec;
}

/**
 * Reset a game's spec (working copy) from its specRef (catalog spec).
 *
 * This replaces all options in the target spec with copies from the source,
 * effectively reverting any user customizations back to the catalog defaults.
 *
 * @param targetSpec - The game's working spec to reset (game.spec)
 * @param sourceSpec - The catalog spec to copy from (game.specRef)
 * @returns Number of options reset
 */
export function resetSpecFromRef(
  targetSpec: GameSpec | MapOfOptions,
  sourceSpec: GameSpec | MapOfOptions,
): number {
  if (!targetSpec?.$isLoaded || !sourceSpec?.$isLoaded) {
    console.warn("[resetSpecFromRef] Specs not loaded");
    return 0;
  }

  // Get all keys from source spec
  const sourceKeys = Object.keys(sourceSpec).filter(
    (k) => !k.startsWith("$") && k !== "_refs" && sourceSpec.$jazz.has(k),
  );

  // Get all keys from target spec (to remove options not in source)
  const targetKeys = Object.keys(targetSpec).filter(
    (k) => !k.startsWith("$") && k !== "_refs" && targetSpec.$jazz.has(k),
  );

  // Remove options from target that don't exist in source
  for (const key of targetKeys) {
    if (!sourceSpec.$jazz.has(key)) {
      targetSpec.$jazz.delete(key);
    }
  }

  // Copy all options from source to target
  let resetCount = 0;
  for (const key of sourceKeys) {
    const option = sourceSpec[key];
    if (!option) continue;

    targetSpec.$jazz.set(key, deepClone(option));
    resetCount++;
  }

  console.log("[resetSpecFromRef] Reset", resetCount, "options from catalog");
  return resetCount;
}
