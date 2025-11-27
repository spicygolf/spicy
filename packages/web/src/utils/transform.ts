import type { GameSpecV03 } from "./arango";

export interface TransformedGameOption {
  name: string;
  disp: string;
  type: "game";
  valueType: "bool" | "num" | "menu" | "text";
  choices?: Array<{ name: string; disp: string }>;
  defaultValue: string;
}

export interface TransformedJunkOption {
  name: string;
  disp: string;
  type: "junk";
  value: number;
}

export interface TransformedMultiplierOption {
  name: string;
  disp: string;
  type: "multiplier";
  value: number;
}

export interface TransformedGameSpec {
  name: string;
  short: string;
  long_description?: string;
  version: number;
  status: "prod" | "dev" | "test";
  spec_type: "points" | "skins";
  min_players: number;
  location_type: "local" | "virtual";
  gameOptions?: TransformedGameOption[];
  junkOptions?: TransformedJunkOption[];
  multiplierOptions?: TransformedMultiplierOption[];
}

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

  // Transform options
  if (v03Spec.options && v03Spec.options.length > 0) {
    transformed.gameOptions = v03Spec.options
      .filter((opt) => opt.type === "game")
      .map((opt) => ({
        name: opt.name,
        disp: opt.disp,
        type: "game" as const,
        valueType: inferValueType(opt),
        choices: opt.choices,
        defaultValue: String(opt.default ?? ""),
      }));
  }

  // Transform junk options
  if (v03Spec.junk && v03Spec.junk.length > 0) {
    transformed.junkOptions = v03Spec.junk.map((junk) => ({
      name: junk.name,
      disp: junk.disp,
      type: "junk" as const,
      value: junk.value,
    }));
  }

  // Transform multipliers
  if (v03Spec.multipliers && v03Spec.multipliers.length > 0) {
    transformed.multiplierOptions = v03Spec.multipliers.map((mult) => ({
      name: mult.name,
      disp: mult.disp,
      type: "multiplier" as const,
      value: mult.value,
    }));
  }

  return transformed;
}

function inferValueType(option: {
  choices?: Array<{ name: string; disp: string }>;
  default?: unknown;
}): "bool" | "num" | "menu" | "text" {
  if (option.choices && option.choices.length > 0) {
    return "menu";
  }

  const defaultVal = option.default;
  if (typeof defaultVal === "boolean") {
    return "bool";
  }

  if (typeof defaultVal === "number") {
    return "num";
  }

  return "text";
}
