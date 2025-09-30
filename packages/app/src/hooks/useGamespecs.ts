import { Group } from "jazz-tools";
import { useAccount } from "jazz-tools/react-native";
import { type defaultSpec, GameSpec, PlayerAccount } from "spicylib/schema";

export function useGamespecs() {
  const { me } = useAccount(PlayerAccount, {
    resolve: {
      root: {
        specs: { $each: true },
      },
    },
  });

  const createGameSpec = (spec: typeof defaultSpec) => {
    if (!me?.root) return null;

    const group = Group.create();
    group.addMember(me, "admin");

    const gameSpec = GameSpec.create(spec, { owner: group });
    me.root.specs.$jazz.push(gameSpec);

    return gameSpec;
  };

  return {
    specs: me?.root?.specs || null,
    createGameSpec,
  };
}
