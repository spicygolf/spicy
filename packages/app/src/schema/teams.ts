import { co, z } from 'jazz-tools';
import { ListOfPlayers } from './players';

export const Team = co.map({
  team: z.string(),
  players: ListOfPlayers,
});
type Team = co.loaded<typeof Team>;

export const ListOfTeams = co.list(Team);
type ListOfTeams = co.loaded<typeof ListOfTeams>;
