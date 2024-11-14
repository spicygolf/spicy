import { CoList, CoMap, co } from "jazz-tools";
import { ListOfPlayers } from "@/schema/players";
import { ListOfRoundToGames } from "@/schema/rounds";
import { ListOfGameSpecs } from "@/schema/gamespecs";
import { ListOfGameHoles } from "@/schema/gameholes";

export class Game extends CoMap {
  start = co.Date;
  name = co.string;
  specs = co.ref(ListOfGameSpecs);
  holes = co.ref(ListOfGameHoles);
  players = co.ref(ListOfPlayers);
  rounds = co.ref(ListOfRoundToGames);

  // const createGame = () => {
  //   const group = Group.create({ owner: me });
  //   group.addMember("everyone", "writer");
  //   const game = Game.create(
  //     { name: "My Game", start: new Date() },
  //     { owner: group }
  //   );
  //   games.push(game);
  // };

}

export class ListOfGames extends CoList.Of(co.ref(Game)) {}
