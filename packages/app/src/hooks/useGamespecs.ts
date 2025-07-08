import { useAccount, useCoState } from 'jazz-tools/react-core';
import { PlayerAccount } from '@/schema/accounts';
import { defaultSpec, GameSpec, ListOfGameSpecs } from '@/schema/gamespecs';

export function useGamespecs() {
  const { me } = useAccount(PlayerAccount, {
    resolve: {
      root: {
        specs: {
          $each: true,
        },
      },
    },
  });
  const specs = useCoState(ListOfGameSpecs, me?.root?.specs?.id);
  if (specs?.length === 0 && me) {
    specs.push(GameSpec.create(defaultSpec, { owner: me }));
  }
  return specs;
}
