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
  }>;
  default_options?: unknown[];
  todos?: string[];
}
