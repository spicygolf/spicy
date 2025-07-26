import { co, z } from "jazz-tools";
import { ListOfPlayers } from "./players";

export const Team = co.map({
  team: z.string(),
  players: ListOfPlayers,
});
export type Team = co.loaded<typeof Team>;

export const ListOfTeams = co.list(Team);
export type ListOfTeams = co.loaded<typeof ListOfTeams>;
