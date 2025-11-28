import { co, z } from "jazz-tools";
import { ListOfGameHoles } from "./gameholes";
import { ListOfGameSpecs } from "./gamespecs";
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
  specs: ListOfGameSpecs,
  holes: ListOfGameHoles,
  players: ListOfPlayers,
  rounds: ListOfRoundToGames,

  /**
   * Options for this specific game instance.
   * Copied from GameSpec.options when the game is created, then customized as needed.
   *
   * This is a snapshot/copy approach (not references):
   * - When creating game: copy all options from gamespec
   * - Users can modify values for this specific game
   * - Games are self-contained and don't break when catalog changes
   * - Historical games maintain their original scoring logic
   *
   * Example: Game starts with "stakes: 1" from gamespec, user changes to "stakes: 5"
   */
  options: co.optional(MapOfOptions),
});
export type Game = co.loaded<typeof Game>;

export const ListOfGames = co.list(Game);
export type ListOfGames = co.loaded<typeof ListOfGames>;
