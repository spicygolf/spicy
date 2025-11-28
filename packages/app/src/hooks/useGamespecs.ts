import { Group } from "jazz-tools";
import { useAccount } from "jazz-tools/react-native";
import { GameSpec, PlayerAccount } from "spicylib/schema";

export function useGamespecs() {
  const me = useAccount(PlayerAccount, {
    resolve: {
      root: {
        specs: { $each: true },
      },
    },
    select: (me) =>
      me.$isLoaded
        ? me
        : me.$jazz.loadingState === "loading"
          ? undefined
          : null,
  });

  const createGameSpec = (spec: {
    name: string;
    short: string;
    long_description?: string;
    version: number;
    status: "prod" | "dev" | "test";
    spec_type: "points" | "skins";
    min_players: number;
    location_type: "local" | "virtual";
  }) => {
    if (!me?.root) return null;

    const group = Group.create();
    group.addMember(me, "admin");

    const gameSpec = GameSpec.create(spec, { owner: group });
    me.root.specs.$jazz.push(gameSpec);

    return gameSpec;
  };

  const specs = me?.root?.specs || null;

  return {
    specs,
    createGameSpec,
  };
}
