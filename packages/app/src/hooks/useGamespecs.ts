import { Group } from "jazz-tools";
import { useAccount } from "jazz-tools/react-native";
import { GameSpec, MetaOption, PlayerAccount } from "spicylib/schema";
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
    const specValues = Object.values(specsMap);
    return specValues.filter(
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

    // GameSpec IS the options map directly - create it empty and add meta options
    const gameSpec = GameSpec.create({}, { owner: group });

    // Helper to create and add a meta option
    const addMetaOption = (
      optName: string,
      value: string | number | boolean,
      valueType: "text" | "num" | "bool" | "menu",
    ) => {
      const opt = MetaOption.create(
        {
          type: "meta",
          name: optName,
          disp: optName, // Display name same as option name for now
          valueType,
          value: String(value),
        },
        { owner: group },
      );
      gameSpec.$jazz.set(optName, opt);
    };

    addMetaOption("name", spec.name, "text");
    addMetaOption("short", spec.short, "text");
    if (spec.long_description) {
      addMetaOption("long_description", spec.long_description, "text");
    }
    addMetaOption("version", spec.version, "num");
    addMetaOption("status", spec.status, "menu");
    addMetaOption("spec_type", spec.spec_type, "menu");
    addMetaOption("min_players", spec.min_players, "num");
    addMetaOption("location_type", spec.location_type, "menu");

    me.root.specs.$jazz.push(gameSpec);

    return gameSpec;
  };

  return {
    specs,
    createGameSpec,
  };
}
