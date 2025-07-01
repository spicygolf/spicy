import { co, z } from 'jazz-tools';
import { ListOfTeams } from '@/schema/teams';

export const GameHole = co.map({
  hole: z.string(),
  seq: z.number(),
  teams: ListOfTeams,
  // multipliers = co.ref(ListOfMultipliers);
});
export type GameHole = co.loaded<typeof GameHole>;

export const ListOfGameHoles = co.list(GameHole);
export type ListOfGameHoles = co.loaded<typeof ListOfGameHoles>;
