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
  valueType: "bool" | "num" | "menu" | "text" | "int_array";
  choices?: Array<{ name: string; disp: string }>;
  defaultValue: string;
  teamOnly?: boolean;
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

export interface TransformedBetOption {
  name: string;
  disp: string;
  type: "bet";
  scope: string;
  scoringType: string;
  splitType: string;
  pct?: number;
  amount?: number;
}

export interface TransformedMetaOption {
  name: string;
  disp: string;
  type: "meta";
  valueType: "bool" | "num" | "menu" | "text" | "text_array";
  value?: string | string[];
  choices?: Array<{ name: string; disp: string }>;
  seq?: number;
  searchable?: boolean;
  required?: boolean;
}

export type TransformedOption =
  | TransformedGameOption
  | TransformedJunkOption
  | TransformedMultiplierOption
  | TransformedBetOption
  | TransformedMetaOption;

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
