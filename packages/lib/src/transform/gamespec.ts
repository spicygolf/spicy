/**
 * Game Spec Transformation
 *
 * Transforms ArangoDB v0.3 game specs to the new schema format.
 * Shared between API (catalog import) and web (user spec export).
 */

import type { GameSpecV03 } from "./arango-types";
import type { TransformedGameSpec, TransformedOption } from "./types";

/**
 * Transform a v0.3 game spec to the new format
 *
 * Includes core fields and optional transformation of game options,
 * junk options, and multipliers into a unified options array.
 */
export function transformGameSpec(v03Spec: GameSpecV03): TransformedGameSpec {
  const transformed: TransformedGameSpec = {
    name: v03Spec.disp,
    short: v03Spec.disp,
    version: v03Spec.version,
    status: v03Spec.status,
    spec_type: v03Spec.type,
    min_players: v03Spec.min_players,
    location_type: v03Spec.location_type,
  };

  const allOptions: TransformedOption[] = [];

  // Transform game options
  if (v03Spec.options && v03Spec.options.length > 0) {
    const gameOptions = v03Spec.options
      .filter((opt) => opt.type === "game")
      .map((opt) => ({
        name: opt.name,
        disp: opt.disp,
        type: "game" as const,
        valueType: inferValueType(opt),
        choices: opt.choices,
        defaultValue: String(opt.default ?? ""),
      }));
    allOptions.push(...gameOptions);
  }

  // Transform junk options
  if (v03Spec.junk && v03Spec.junk.length > 0) {
    const junkOptions = v03Spec.junk.map((junk) => ({
      name: junk.name,
      disp: junk.disp,
      type: "junk" as const,
      value: junk.value,
    }));
    allOptions.push(...junkOptions);
  }

  // Transform multipliers
  if (v03Spec.multipliers && v03Spec.multipliers.length > 0) {
    const multiplierOptions = v03Spec.multipliers.map((mult) => ({
      name: mult.name,
      disp: mult.disp,
      type: "multiplier" as const,
      value: mult.value,
    }));
    allOptions.push(...multiplierOptions);
  }

  if (allOptions.length > 0) {
    transformed.options = allOptions;
  }

  return transformed;
}

/**
 * Infer the value type from an option's structure
 */
function inferValueType(option: {
  choices?: Array<{ name: string; disp: string }>;
  default?: unknown;
}): "boolean" | "number" | "select" {
  if (option.choices && option.choices.length > 0) {
    return "select";
  }
  if (typeof option.default === "boolean") {
    return "boolean";
  }
  return "number";
}
