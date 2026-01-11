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

import type {
  GameOption,
  JunkOption,
  MultiplierOption,
  Option,
} from "../schema";
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
    if (holeOption?.$isLoaded) {
      const value = extractOptionValue(holeOption);
      if (value !== undefined) {
        return value;
      }
    }
  }

  // 2. Fall back to game/spec options
  const option = ctx.options?.[optionName];
  if (option?.$isLoaded) {
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
    if (holeOption?.$isLoaded) {
      return holeOption;
    }
  }

  // 2. Fall back to game/spec options
  const option = ctx.options?.[optionName];
  if (option?.$isLoaded) {
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

    const opt = options[key];
    if (opt?.$isLoaded && opt.type === "junk") {
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
