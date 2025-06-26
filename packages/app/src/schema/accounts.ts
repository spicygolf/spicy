import { co, z } from 'jazz-tools';
import { ListOfGames } from '@/schema/games';
import { ListOfGameSpecs } from '@/schema/gamespecs';
import { Player } from '@/schema/players';

export const PlayerAccountRoot = co.map({
  player: Player,
  games: ListOfGames,
  specs: ListOfGameSpecs,
});

export const PlayerAccountProfile = co.map({
  name: z.string(),
  short: z.string(),
  email: z.string(),
  level: z.string(),
});

export const PlayerAccount = co.account({
  root: PlayerAccountRoot,
  profile: PlayerAccountProfile,
});
export type PlayerAccount = co.loaded<typeof PlayerAccount>;

//   async migrate(creationProps?: { name: string }) {
//     if (this.root === undefined) {
//       const name = creationProps?.name || '';
//       this.root = PlayerAccountRoot.create({
//         player: Player.create({ name, short: name, email: '', level: '' }),
//         games: ListOfGames.create([], { owner: this }),
//         specs: ListOfGameSpecs.create([GameSpec.create(defaultSpec)]),
//       });
//     }
//   }
// }
