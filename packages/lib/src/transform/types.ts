/**
 * Transform Types
 *
 * Types for transformed game specs and options.
 * These represent the target schema after transformation from ArangoDB v0.3.
 */

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

export type TransformedOption =
  | TransformedGameOption
  | TransformedJunkOption
  | TransformedMultiplierOption;

export interface TransformedGameSpec {
  name: string;
  short: string;
  long_description?: string;
  version: number;
  status: "prod" | "dev" | "test";
  spec_type: "points" | "skins";
  min_players: number;
  location_type: "local" | "virtual";
  options?: TransformedOption[];
}
