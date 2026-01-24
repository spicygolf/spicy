/**
 * ArangoDB Type Definitions
 *
 * Type definitions for data structures from the legacy ArangoDB v0.3 system.
 * Used for importing and transforming historical game data.
 */

export interface GameSpecV03 {
  _key?: string;
  name: string;
  disp: string;
  version: number;
  status: "prod" | "dev" | "test";
  type: "points" | "skins";
  max_players: number;
  min_players: number;
  location_type: "local" | "virtual";
  long_description?: string;
  teams?: boolean;
  team_size?: number;
  team_determination?: string;
  team_change_every?: number;
  scoring?: Record<string, unknown>;
  junk?: Array<{
    name: string;
    disp: string;
    type: string;
    value: number;
    [key: string]: unknown;
  }>;
  multipliers?: Array<{
    name: string;
    disp: string;
    value: number;
    [key: string]: unknown;
  }>;
  options?: Array<{
    name: string;
    disp: string;
    type: string;
    default?: unknown;
    choices?: Array<{ name: string; disp: string }>;
    teamOnly?: boolean;
  }>;
  meta?: Array<{
    name: string;
    disp: string;
    valueType: string;
    value?: string | string[];
    choices?: Array<{ name: string; disp: string }>;
    seq?: number;
    searchable?: boolean;
    required?: boolean;
  }>;
  default_options?: unknown[];
  todos?: string[];
}
