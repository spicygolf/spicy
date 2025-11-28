/**
 * Transform Utilities
 *
 * Utilities for transforming ArangoDB data to new schema formats.
 */

export type { GameSpecV03 } from "./arango-types";
export { transformGameSpec } from "./gamespec";
export type {
  TransformedGameOption,
  TransformedGameSpec,
  TransformedJunkOption,
  TransformedMultiplierOption,
} from "./types";
