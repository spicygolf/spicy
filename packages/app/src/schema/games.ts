import { co, z } from 'jazz-tools';
import { ListOfGameHoles } from '@/schema/gameholes';
import { ListOfGameSpecs } from '@/schema/gamespecs';
import { ListOfPlayers } from '@/schema/players';
import { ListOfRoundToGames } from '@/schema/rounds';

export const Game = co.map({
  start: z.date(),
  name: z.string(),
  specs: ListOfGameSpecs,
  holes: ListOfGameHoles,
  players: ListOfPlayers,
  rounds: ListOfRoundToGames,
});
export type Game = co.loaded<typeof Game>;

//   static createGame(spec: GameSpec, owner: PlayerAccount): Game {
//     const group = Group.create({ owner });
//     const specs = ListOfGameSpecs.create([], { owner });
//     specs.push(spec);
//     const holes = ListOfGameHoles.create([], { owner });
//     const players = ListOfPlayers.create([], { owner });
//     if (!owner.root?.player) {
//       console.warn('Game.createGame: no player in PlayerAccount');
//     } else {
//       players.push(owner.root?.player!);
//     }
//     const rounds = ListOfRoundToGames.create([], { owner });
//     const game = Game.create(
//       {
//         start: new Date(),
//         name: spec.name,
//         specs,
//         holes,
//         players,
//         rounds,
//       },
//       { owner: group },
//     );
//     if (!owner.root?.games) {
//       console.warn('Game.createGame: no games in PlayerAccount');
//     } else {
//       owner.root?.games?.push(game);
//     }
//     return game;
//   }
// }

export const ListOfGames = co.list(Game);
export type ListOfGames = co.loaded<typeof ListOfGames>;
