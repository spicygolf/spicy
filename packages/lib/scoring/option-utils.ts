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
import type {
  Game,
  GameHole,
  GameOption,
  GameSpec,
  JunkOption,
  MapOfOptions,
  MetaOption,
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
 * Resolution order:
 * 1. Game's working spec copy (game.spec) - primary source
 * 2. Legacy game.specs[0] options - backwards compatibility
 * 3. Spec reference (game.specRef) - fallback if spec not copied yet
 *
 * Note: game.options is deprecated - user changes go into game.spec directly.
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

  // Helper to check if field exists (Jazz CoMap pattern)
  // In tests, $jazz may not exist on mock objects
  const hasField = (obj: unknown, field: string) => {
    const o = obj as { $jazz?: { has?: (f: string) => boolean } };
    return o.$jazz?.has ? o.$jazz.has(field) : field in (o as object);
  };

  // 1. Game's working spec copy (primary source)
  if (hasField(game, "spec") && game.spec?.$isLoaded) {
    // Check if spec map has any actual options (not just empty)
    const hasOptions = Object.keys(game.spec).some(
      (k) => !k.startsWith("$") && k !== "_refs",
    );
    if (hasOptions) {
      return game.spec;
    }
  }

  // 2. Legacy game.specs[0] - backwards compatibility
  if (
    hasField(game, "specs") &&
    game.specs?.$isLoaded &&
    game.specs.length > 0
  ) {
    const spec = game.specs[0];
    if (spec?.$isLoaded) {
      return spec;
    }
  }

  // 3. Spec reference (fallback if spec not populated yet)
  if (hasField(game, "specRef") && game.specRef?.$isLoaded) {
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
 * @param sourceSpec - The spec to copy options from (typically game.specRef)
 * @param owner - The Jazz Group that will own the new options
 * @returns A new MapOfOptions with copies of all options
 */
export async function copySpecOptions(
  sourceSpec: GameSpec | MapOfOptions,
  owner: Group,
): Promise<MapOfOptions> {
  // Import schema types dynamically to avoid circular dependency
  const {
    MapOfOptions,
    GameOption,
    JunkOption,
    MultiplierOption,
    MetaOption,
    ChoicesList,
    ChoiceMap,
    StringList,
  } = await import("../schema");

  const newSpec = MapOfOptions.create({}, { owner });

  if (!sourceSpec?.$isLoaded) return newSpec;

  // Iterate over all options in source spec
  for (const key of Object.keys(sourceSpec)) {
    if (key.startsWith("$") || key === "_refs") continue;
    if (!sourceSpec.$jazz.has(key)) continue;

    const option = sourceSpec[key];
    if (!option?.$isLoaded) continue;

    // Create a copy based on option type
    switch (option.type) {
      case "game": {
        const src = option as GameOption;
        const copy = GameOption.create(
          {
            name: src.name,
            disp: src.disp,
            type: "game",
            version: src.version,
            valueType: src.valueType,
            defaultValue: src.defaultValue,
          },
          { owner },
        );
        if (src.value !== undefined) copy.$jazz.set("value", src.value);
        if (src.seq !== undefined) copy.$jazz.set("seq", src.seq);
        if (src.teamOnly !== undefined)
          copy.$jazz.set("teamOnly", src.teamOnly);
        // Copy choices if present
        if (src.$jazz.has("choices") && src.choices?.$isLoaded) {
          const choicesCopy = ChoicesList.create([], { owner });
          for (const choice of src.choices) {
            if (choice?.$isLoaded) {
              choicesCopy.$jazz.push(
                ChoiceMap.create(
                  { name: choice.name, disp: choice.disp },
                  { owner },
                ),
              );
            }
          }
          copy.$jazz.set("choices", choicesCopy);
        }
        newSpec.$jazz.set(key, copy);
        break;
      }
      case "junk": {
        const src = option as JunkOption;
        const copy = JunkOption.create(
          {
            name: src.name,
            disp: src.disp,
            type: "junk",
            version: src.version,
            value: src.value,
          },
          { owner },
        );
        if (src.sub_type) copy.$jazz.set("sub_type", src.sub_type);
        if (src.seq !== undefined) copy.$jazz.set("seq", src.seq);
        if (src.scope) copy.$jazz.set("scope", src.scope);
        if (src.icon) copy.$jazz.set("icon", src.icon);
        if (src.show_in) copy.$jazz.set("show_in", src.show_in);
        if (src.based_on) copy.$jazz.set("based_on", src.based_on);
        if (src.limit) copy.$jazz.set("limit", src.limit);
        if (src.calculation) copy.$jazz.set("calculation", src.calculation);
        if (src.logic) copy.$jazz.set("logic", src.logic);
        if (src.better) copy.$jazz.set("better", src.better);
        if (src.score_to_par) copy.$jazz.set("score_to_par", src.score_to_par);
        newSpec.$jazz.set(key, copy);
        break;
      }
      case "multiplier": {
        const src = option as MultiplierOption;
        const copy = MultiplierOption.create(
          {
            name: src.name,
            disp: src.disp,
            type: "multiplier",
            version: src.version,
          },
          { owner },
        );
        if (src.value !== undefined) copy.$jazz.set("value", src.value);
        if (src.sub_type) copy.$jazz.set("sub_type", src.sub_type);
        if (src.seq !== undefined) copy.$jazz.set("seq", src.seq);
        if (src.icon) copy.$jazz.set("icon", src.icon);
        if (src.based_on) copy.$jazz.set("based_on", src.based_on);
        if (src.scope) copy.$jazz.set("scope", src.scope);
        if (src.availability) copy.$jazz.set("availability", src.availability);
        if (src.override !== undefined)
          copy.$jazz.set("override", src.override);
        if (src.input_value !== undefined)
          copy.$jazz.set("input_value", src.input_value);
        if (src.value_from) copy.$jazz.set("value_from", src.value_from);
        newSpec.$jazz.set(key, copy);
        break;
      }
      case "meta": {
        const src = option as MetaOption;
        const copy = MetaOption.create(
          {
            name: src.name,
            disp: src.disp,
            type: "meta",
            valueType: src.valueType,
          },
          { owner },
        );
        if (src.value !== undefined) copy.$jazz.set("value", src.value);
        if (src.seq !== undefined) copy.$jazz.set("seq", src.seq);
        if (src.searchable !== undefined)
          copy.$jazz.set("searchable", src.searchable);
        if (src.required !== undefined)
          copy.$jazz.set("required", src.required);
        // Copy valueArray if present (for text_array type)
        if (src.$jazz.has("valueArray") && src.valueArray?.$isLoaded) {
          const arrayCopy = StringList.create([...src.valueArray], { owner });
          copy.$jazz.set("valueArray", arrayCopy);
        }
        // Copy choices if present (for menu type)
        if (src.$jazz.has("choices") && src.choices?.$isLoaded) {
          const choicesCopy = ChoicesList.create([], { owner });
          for (const choice of src.choices) {
            if (choice?.$isLoaded) {
              choicesCopy.$jazz.push(
                ChoiceMap.create(
                  { name: choice.name, disp: choice.disp },
                  { owner },
                ),
              );
            }
          }
          copy.$jazz.set("choices", choicesCopy);
        }
        newSpec.$jazz.set(key, copy);
        break;
      }
    }
  }

  return newSpec;
}
