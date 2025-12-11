import { co, z } from "jazz-tools";
import { Course } from "./courses";
import { Game } from "./games";
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
 * MapOfCourses - Map of GHIN course ID to Course
 * Enables enumeration of all imported courses
 */
export const MapOfCourses = co.record(z.string(), Course);
export type MapOfCourses = co.loaded<typeof MapOfCourses>;

/**
 * MapOfGames - Map of legacy game ID to Game
 * Enables enumeration of all imported games
 */
export const MapOfGames = co.record(z.string(), Game);
export type MapOfGames = co.loaded<typeof MapOfGames>;

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
 * - players: "ghinId" or "manual_{legacyId}" (e.g., "1234567" or "manual_abc123")
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
  courses: co.optional(MapOfCourses),
  games: co.optional(MapOfGames),
});
export type GameCatalog = co.loaded<typeof GameCatalog>;
