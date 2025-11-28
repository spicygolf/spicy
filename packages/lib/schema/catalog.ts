import { co, z } from "jazz-tools";
import { MapOfGameSpecs } from "./gamespecs";
import { GameOption, JunkOption, MultiplierOption } from "./options";

/**
 * Maps for storing options by name (idempotent)
 */
export const MapOfGameOptions = co.record(z.string(), GameOption);
export type MapOfGameOptions = co.loaded<typeof MapOfGameOptions>;

export const MapOfJunkOptions = co.record(z.string(), JunkOption);
export type MapOfJunkOptions = co.loaded<typeof MapOfJunkOptions>;

export const MapOfMultiplierOptions = co.record(z.string(), MultiplierOption);
export type MapOfMultiplierOptions = co.loaded<typeof MapOfMultiplierOptions>;

/**
 * GameCatalog - Shared, public catalog of game specifications and options
 *
 * Owned by JAZZ_WORKER_ACCOUNT and made public for all users to read.
 * Contains:
 * - Game specs (Ten Points, Wolf, Nassau, etc.)
 * - Reusable options (game settings, junk, multipliers)
 *
 * Uses maps with keys for idempotent updates:
 * - specs: "name-version" (e.g., "Ten Points-1")
 * - options: "name" (e.g., "stakes", "birdie", "double")
 *
 * Users can:
 * - Browse and favorite catalog specs
 * - Create lightweight customizations (overrides)
 * - Fork specs completely as custom specs
 */
export const GameCatalog = co.map({
  specs: MapOfGameSpecs,
  gameOptions: co.optional(MapOfGameOptions),
  junkOptions: co.optional(MapOfJunkOptions),
  multiplierOptions: co.optional(MapOfMultiplierOptions),
});
export type GameCatalog = co.loaded<typeof GameCatalog>;
