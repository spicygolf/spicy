import { co, CoList, CoMap } from "jazz-tools";
import { ListOfPlayers } from "./players";

export class Team extends CoMap {
  team = co.string;
  players = co.ref(ListOfPlayers);
}

export class ListOfTeams extends CoList.Of(co.ref(Team)) {}
