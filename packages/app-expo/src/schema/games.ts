import { CoList, CoMap, Profile, co } from "jazz-tools";
import { ListOfPlayers, Player } from "@/schema/players";
import { Round } from "@/schema/rounds";

export class Game extends CoMap {
  start = co.Date;
  name = co.string;
  specs = co.ref(ListOfGameSpecs);
  holes = co.ref(ListOfGameHoles);
  players_rounds = co.ref(ListOfPlayerRounds);
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

export class Team extends CoMap {
  team = co.string;
  players = co.ref(ListOfPlayers);
}

export class GameHole extends CoMap {
  hole = co.string;
  seq = co.number;
  teams = co.ref(ListOfTeams);
  // multipliers = co.ref(ListOfMultipliers);
}

export class PlayerRound extends CoMap {
  player = co.ref(Player);
  round = co.ref(Round);
}


export class ListOfGames extends CoList.Of(co.ref(Game)) {}

export class ListOfGameSpecs extends CoList.Of(co.ref(GameSpec)) {}

export class ListOfTeams extends CoList.Of(co.ref(Team)) {}

export class ListOfGameHoles extends CoList.Of(co.ref(GameHole)) {}

export class ListOfPlayerRounds extends CoList.Of(co.ref(PlayerRound)) {}
