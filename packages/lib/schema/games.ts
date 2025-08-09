import { co, z } from "jazz-tools";
import { ListOfGameHoles } from "./gameholes";
import { ListOfGameSpecs } from "./gamespecs";
import { ListOfPlayers } from "./players";
import { ListOfRoundToGames } from "./rounds";

export const Game = co.map({
  start: z.date(),
  name: z.string(),
  specs: ListOfGameSpecs,
  holes: ListOfGameHoles,
  players: ListOfPlayers,
  rounds: ListOfRoundToGames,
});
export type Game = co.loaded<typeof Game>;

export const ListOfGames = co.list(Game);
export type ListOfGames = co.loaded<typeof ListOfGames>;
