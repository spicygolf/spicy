import { co, z } from "jazz-tools";
import { MapOfGameSpecs } from "./gamespecs";
import { MapOfOptions } from "./options";
import { Player } from "./players";

/**
 * MapOfPlayers - Map of GHIN ID to Player
 * Enables enumeration of all imported players
 */
export const MapOfPlayers = co.record(z.string(), Player);
export type MapOfPlayers = co.loaded<typeof MapOfPlayers>;

/**
 * GameCatalog - Shared, public catalog of game specifications, options, and players
 *
 * Owned by JAZZ_WORKER_ACCOUNT and made public for all users to read.
 * Contains:
 * - Game specs (Ten Points, Wolf, Nassau, etc.)
 * - Reusable options (game settings, junk, multipliers)
 * - Players imported from v0.3 (public GHIN data)
 *
 * Uses maps with keys for idempotent updates:
 * - specs: "name-version" (e.g., "Ten Points-1")
 * - options: "name" (e.g., "stakes", "birdie", "double")
 * - players: "ghinId" (e.g., "1234567")
 *
 * Users can:
 * - Browse and favorite catalog specs
 * - Create lightweight customizations (overrides)
 * - Fork specs completely as custom specs
 * - Search and link to players by GHIN ID
 */
export const GameCatalog = co.map({
  specs: MapOfGameSpecs,
  options: co.optional(MapOfOptions),
  players: co.optional(MapOfPlayers),
});
export type GameCatalog = co.loaded<typeof GameCatalog>;
