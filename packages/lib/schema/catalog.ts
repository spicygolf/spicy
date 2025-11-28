import { co } from "jazz-tools";
import { MapOfGameSpecs } from "./gamespecs";
import { MapOfOptions } from "./options";

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
  options: co.optional(MapOfOptions),
});
export type GameCatalog = co.loaded<typeof GameCatalog>;
