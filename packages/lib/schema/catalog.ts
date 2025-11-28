import { co } from "jazz-tools";
import { MapOfGameSpecs } from "./gamespecs";

/**
 * GameCatalog - Shared, public catalog of game specifications
 *
 * Owned by JAZZ_WORKER_ACCOUNT and made public for all users to read.
 * Contains canonical game specs (Ten Points, Wolf, Nassau, etc.)
 *
 * Uses MapOfGameSpecs with keys in format "name-version" for idempotent updates.
 *
 * Users can:
 * - Browse and favorite catalog specs
 * - Create lightweight customizations (overrides)
 * - Fork specs completely as custom specs
 */
export const GameCatalog = co.map({
  specs: MapOfGameSpecs,
});
export type GameCatalog = co.loaded<typeof GameCatalog>;
