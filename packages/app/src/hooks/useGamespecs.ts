import { Group } from "jazz-tools";
import { useAccount } from "jazz-tools/react-native";
import { GameSpec, PlayerAccount } from "spicylib/schema";
import { useJazzWorker } from "./useJazzWorker";

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

  // Load worker account's catalog
  const { account: workerAccount } = useJazzWorker({
    profile: {
      catalog: {
        specs: { $each: true },
      },
    },
  });

  // Convert MapOfGameSpecs to array for compatibility with existing code
  const specs: GameSpec[] | null = (() => {
    if (!workerAccount?.$isLoaded) return null;
    if (!workerAccount.profile?.$isLoaded) return null;
    if (!workerAccount.profile.catalog?.$isLoaded) return null;
    if (!workerAccount.profile.catalog.specs?.$isLoaded) return null;

    const specsMap = workerAccount.profile.catalog.specs;
    return Object.values(specsMap).filter(
      (spec): spec is GameSpec => spec?.$isLoaded === true,
    );
  })();

  const createGameSpec = (spec: {
    name: string;
    short: string;
    long_description?: string;
    version: number;
    status: "prod" | "dev" | "test";
    spec_type: "points" | "skins";
    min_players: number;
    location_type: "local" | "virtual";
  }): GameSpec | null => {
    if (!me?.$isLoaded) return null;
    if (!me.root?.$isLoaded) return null;
    if (!me.root.specs?.$isLoaded) return null;

    const group = Group.create();
    group.addMember(me, "admin");

    const gameSpec = GameSpec.create(spec, { owner: group });
    me.root.specs.$jazz.push(gameSpec);

    return gameSpec;
  };

  return {
    specs,
    createGameSpec,
  };
}
