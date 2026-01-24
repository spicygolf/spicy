import { co, z } from "jazz-tools";
import { ListOfGameHoles } from "./gameholes";
import { GameSpec, ListOfGameSpecs } from "./gamespecs";
import { MapOfOptions } from "./options";
import { ListOfPlayers } from "./players";
import { ListOfRoundToGames } from "./rounds";
import { TeamsConfig } from "./teamsconfig";

export const GameScope = co.map({
  /**
   * Which holes are being played in this game.
   * "all18" - full 18 holes
   * "front9" - holes 1-9
   * "back9" - holes 10-18
   */
  holes: z.literal(["all18", "front9", "back9"]),

  /**
   * Team configuration for this game.
   * If present, the game uses teams. Check rotateEvery to determine
   * whether teams are set in settings (0) or during play (>0).
   */
  teamsConfig: co.optional(TeamsConfig),
});
export type GameScope = co.loaded<typeof GameScope>;

export const Game = co.map({
  start: z.date(),
  name: z.string(),
  scope: GameScope,

  /**
   * Reference to the game spec in the catalog.
   * This is the authoritative source for scoring rules.
   * Also used for display, "reset to defaults", and "show diff" features.
   */
  specRef: co.optional(GameSpec),

  /**
   * @deprecated Use specRef instead.
   * Kept for backwards compatibility with existing games.
   */
  specs: co.optional(ListOfGameSpecs),

  holes: ListOfGameHoles,
  players: ListOfPlayers,
  rounds: ListOfRoundToGames,

  /**
   * Game-level option overrides.
   * Values here override the specRef defaults.
   * Used when users customize options for a specific game.
   * Per-hole overrides go in GameHole.options instead.
   */
  options: co.optional(MapOfOptions),

  /**
   * Legacy ID from ArangoDB v0.3 import (_key field).
   * Used for idempotent imports and tracking migrated games.
   */
  legacyId: z.string().optional(),
});
export type Game = co.loaded<typeof Game>;

export const ListOfGames = co.list(Game);
export type ListOfGames = co.loaded<typeof ListOfGames>;
