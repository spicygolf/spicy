import { Group } from "jazz-tools";
import { useAccount, useCoState } from "jazz-tools/react-core";
import {
  defaultSpec,
  GameSpec,
  ListOfGameSpecs,
  PlayerAccount,
} from "spicylib/schema";

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
    const group = Group.create();
    group.addMember(me, "writer");
    specs.push(GameSpec.create(defaultSpec, { owner: group }));
  }
  return specs;
}
