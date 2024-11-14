import { CoList, CoMap, Profile, co } from "jazz-tools";
import { Player } from "@/schema/players";
import { ListOfTeams } from "@/schema/teams";
import { ListOfRoundToGames } from "@/schema/rounds";

export class Game extends CoMap {
  start = co.Date;
  name = co.string;
  specs = co.ref(ListOfGameSpecs);
  holes = co.ref(ListOfGameHoles);
  players = co.ref(ListOfPlayers);
  rounds = co.ref(ListOfRoundToGames);
}

export class GameSpec extends CoMap {
  name = co.string;
  version = co.number;
  status = co.literal("prod", "dev", "test");
  type = co.literal("points", "skins");
  min_players = co.number;
  location_type = co.literal("local", "virtual");
  teams = co.boolean;
}

export class GameHole extends CoMap {
  hole = co.string;
  seq = co.number;
  teams = co.ref(ListOfTeams);
  // multipliers = co.ref(ListOfMultipliers);
}


export class ListOfGames extends CoList.Of(co.ref(Game)) {}

export class ListOfGameSpecs extends CoList.Of(co.ref(GameSpec)) {}

export class ListOfGameHoles extends CoList.Of(co.ref(GameHole)) {}

export class ListOfPlayers extends CoList.Of(co.ref(Player)) {}
