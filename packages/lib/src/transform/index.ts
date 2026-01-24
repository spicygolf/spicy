/**
 * Transform Utilities
 *
 * Utilities for transforming legacy v0.3 data to new schema formats.
 */

export { transformGameSpec } from "./gamespec";
export type { GameSpecV03 } from "./legacy-types";
export type {
  TransformedGameOption,
  TransformedGameSpec,
  TransformedJunkOption,
  TransformedMultiplierOption,
} from "./types";
