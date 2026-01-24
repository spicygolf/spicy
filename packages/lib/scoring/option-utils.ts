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
  Game,
  GameHole,
  GameOption,
  GameSpec,
  JunkOption,
  MetaOption,
  MultiplierOption,
  Option,
  SpecSnapshot,
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

// =============================================================================
// Meta Option Helpers
// =============================================================================

/**
 * Get a meta option value from a GameSpec or SpecSnapshot.
 *
 * Meta options store spec-level metadata like short name, aliases, status, etc.
 * This replaces direct access to deprecated top-level GameSpec fields.
 *
 * @param source - GameSpec or SpecSnapshot to read from
 * @param optionName - Name of the meta option (e.g., "short", "aliases", "status")
 * @returns The meta option value, or undefined if not found
 *
 * @example
 * const shortName = getMetaOption(spec, "short"); // "5pts"
 * const aliases = getMetaOption(spec, "aliases"); // ["Scotch", "Umbrella"]
 * const status = getMetaOption(spec, "status"); // "prod"
 */
export function getMetaOption(
  source: GameSpec | SpecSnapshot | undefined | null,
  optionName: string,
): string | number | boolean | string[] | undefined {
  if (!source?.$isLoaded) return undefined;

  const options = source.options;
  if (!options?.$isLoaded) return undefined;

  const option = options[optionName];
  if (!option?.$isLoaded || option.type !== "meta") return undefined;

  const metaOpt = option as MetaOption;

  // For text_array type, return the array value
  if (metaOpt.valueType === "text_array") {
    if (!metaOpt.valueArray?.$isLoaded) return undefined;
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
 * Get a spec field value, preferring meta option over deprecated top-level field.
 *
 * This provides backwards compatibility during migration from top-level fields
 * to meta options. Once migration is complete, this can be simplified to just
 * call getMetaOption.
 *
 * @param spec - GameSpec to read from
 * @param fieldName - Field name (e.g., "short", "status", "min_players")
 * @returns The field value from meta option or deprecated top-level field
 */
export function getSpecField(
  spec: GameSpec | undefined | null,
  fieldName: string,
): string | number | boolean | string[] | undefined {
  if (!spec?.$isLoaded) return undefined;

  // First try meta option (new architecture)
  const metaValue = getMetaOption(spec, fieldName);
  if (metaValue !== undefined) return metaValue;

  // Fall back to deprecated top-level fields (backwards compat)
  switch (fieldName) {
    case "short":
      return spec.short;
    case "long_description":
      return spec.long_description;
    case "status":
      return spec.status;
    case "spec_type":
      return spec.spec_type;
    case "min_players":
      return spec.min_players;
    case "location_type":
      return spec.location_type;
    default:
      return undefined;
  }
}

/**
 * Get the effective options source for a game.
 *
 * Resolution order:
 * 1. Game-level option overrides
 * 2. Spec snapshot options (historical)
 * 3. Spec reference options (live)
 * 4. Legacy game.specs[0] options
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

  // Game-level overrides
  if (game.options?.$isLoaded) {
    return game.options;
  }

  // Spec snapshot (historical)
  if (game.specSnapshot?.$isLoaded && game.specSnapshot.options?.$isLoaded) {
    return game.specSnapshot.options;
  }

  // Spec reference (live)
  if (game.specRef?.$isLoaded && game.specRef.options?.$isLoaded) {
    return game.specRef.options;
  }

  // Legacy game.specs[0]
  if (game.specs?.$isLoaded && game.specs.length > 0) {
    const spec = game.specs[0];
    if (spec?.$isLoaded && spec.options?.$isLoaded) {
      return spec.options;
    }
  }

  return undefined;
}
