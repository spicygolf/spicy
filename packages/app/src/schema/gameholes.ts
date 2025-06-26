import { co, z } from 'jazz-tools';
import { ListOfTeams } from '@/schema/teams';

export const GameHole = co.map({
  hole: z.string(),
  seq: z.number(),
  teams: ListOfTeams,
  // multipliers = co.ref(ListOfMultipliers);
});
type GameHole = co.loaded<typeof GameHole>;

export const ListOfGameHoles = co.list(GameHole);
type ListOfGameHoles = co.loaded<typeof ListOfGameHoles>;
