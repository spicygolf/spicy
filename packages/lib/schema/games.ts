import { co, z } from "jazz-tools";
import { ListOfGameHoles } from "./gameholes";
import { ListOfGameSpecs } from "./gamespecs";
import { ListOfPlayers } from "./players";
import { ListOfRoundToGames } from "./rounds";

export const GameScope = co.map({
  /**
   * Which holes are being played in this game.
   * "all18" - full 18 holes
   * "front9" - holes 1-9
   * "back9" - holes 10-18
   */
  holes: z.literal(["all18", "front9", "back9"]),

  /**
   * How often teams rotate/change during the game (in holes).
   * 0 - teams never rotate (stay the same throughout)
   * 1 - teams change every hole
   * 3 - teams change every 3 holes
   * 6 - teams change every 6 holes
   * 9 - teams change every 9 holes
   */
  teamsRotateEvery: z.optional(z.number()),

  /**
   * Order of player IDs for determining team lead rotation (e.g., Wolf, Captain).
   * Used by games that rotate a special role among players.
   */
  teamLeadOrder: z.optional(z.array(z.string())),
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
});
export type Game = co.loaded<typeof Game>;

export const ListOfGames = co.list(Game);
export type ListOfGames = co.loaded<typeof ListOfGames>;
