import { CoList, CoMap, co, Group } from 'jazz-tools';
import { PlayerAccount } from '@/schema/accounts';
import { ListOfGameHoles } from '@/schema/gameholes';
import { GameSpec, ListOfGameSpecs } from '@/schema/gamespecs';
import { ListOfPlayers } from '@/schema/players';
import { ListOfRoundToGames } from '@/schema/rounds';

export class Game extends CoMap {
  start = co.Date;
  name = co.string;
  specs = co.ref(ListOfGameSpecs);
  holes = co.ref(ListOfGameHoles);
  players = co.ref(ListOfPlayers);
  rounds = co.ref(ListOfRoundToGames);

  static createGame(spec: GameSpec, owner: PlayerAccount): Game {
    const group = Group.create({ owner });
    const specs = ListOfGameSpecs.create([], { owner });
    specs.push(spec);
    const holes = ListOfGameHoles.create([], { owner });
    const players = ListOfPlayers.create([], { owner });
    if (!owner.root?.player) {
      console.warn('Game.createGame: no player in PlayerAccount');
    } else {
      players.push(owner.root?.player!);
    }
    const rounds = ListOfRoundToGames.create([], { owner });
    const game = Game.create(
      {
        start: new Date(),
        name: spec.name,
        specs,
        holes,
        players,
        rounds,
      },
      { owner: group },
    );
    if (!owner.root?.games) {
      console.warn('Game.createGame: no games in PlayerAccount');
    } else {
      owner.root?.games?.push(game);
    }
    return game;
  }
}

export class ListOfGames extends CoList.Of(co.ref(Game)) {}
