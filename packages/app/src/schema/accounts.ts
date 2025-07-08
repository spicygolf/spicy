import { co, z } from 'jazz-tools';
import { ListOfGames } from '@/schema/games';
import { defaultSpec, GameSpec, ListOfGameSpecs } from '@/schema/gamespecs';
import { Player } from '@/schema/players';

export const PlayerAccountRoot = co.map({
  player: Player,
  games: ListOfGames,
  specs: ListOfGameSpecs,
});
export type PlayerAccountRoot = co.loaded<typeof PlayerAccountRoot>;

export const PlayerAccountProfile = co.map({
  name: z.string(),
});
export type PlayerAccountProfile = co.loaded<typeof PlayerAccountProfile>;

export const PlayerAccount = co
  .account({
    root: PlayerAccountRoot,
    profile: PlayerAccountProfile,
  })
  .withMigration((account, creationProps?: { name: string }) => {
    if (account.root === undefined) {
      const name = creationProps?.name || '';
      account.root = PlayerAccountRoot.create(
        {
          player: Player.create(
            {
              name,
              short: name,
              email: '',
              level: '',
              handicap: undefined,
              envs: undefined,
            },
            { owner: account },
          ),
          games: ListOfGames.create([], { owner: account }),
          specs: ListOfGameSpecs.create(
            [GameSpec.create(defaultSpec, { owner: account })],
            { owner: account },
          ),
        },
        { owner: account },
      );
    }
  });
export type PlayerAccount = co.loaded<typeof PlayerAccount>;
