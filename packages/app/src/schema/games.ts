import { co, z } from 'jazz-tools';
import { ListOfGameHoles } from '@/schema/gameholes';
import { ListOfGameSpecs } from '@/schema/gamespecs';
import { ListOfPlayers } from '@/schema/players';
import { ListOfRoundToGames } from '@/schema/rounds';

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
