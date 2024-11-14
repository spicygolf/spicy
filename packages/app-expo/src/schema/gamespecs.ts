import { co, CoList, CoMap } from "jazz-tools";

export class GameSpec extends CoMap {
  name = co.string;
  version = co.number;
  status = co.literal("prod", "dev", "test");
  type = co.literal("points", "skins");
  min_players = co.number;
  location_type = co.literal("local", "virtual");
  teams = co.boolean;
}

export class ListOfGameSpecs extends CoList.Of(co.ref(GameSpec)) {}
