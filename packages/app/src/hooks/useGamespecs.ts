import { Group } from "jazz-tools";
import { useAccount } from "jazz-tools/react-native";
import {
  GameSpec,
  MapOfOptions,
  MetaOption,
  PlayerAccount,
} from "spicylib/schema";
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

    // Create options map with meta options for all fields
    const options = MapOfOptions.create({}, { owner: group });

    // Helper to create a meta option
    const createMetaOption = (
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
      options.$jazz.set(optName, opt);
    };

    createMetaOption("name", spec.name, "text");
    createMetaOption("short", spec.short, "text");
    if (spec.long_description) {
      createMetaOption("long_description", spec.long_description, "text");
    }
    createMetaOption("version", spec.version, "num");
    createMetaOption("status", spec.status, "menu");
    createMetaOption("spec_type", spec.spec_type, "menu");
    createMetaOption("min_players", spec.min_players, "num");
    createMetaOption("location_type", spec.location_type, "menu");

    // Create the GameSpec with options only
    const gameSpec = GameSpec.create({ options }, { owner: group });
    me.root.specs.$jazz.push(gameSpec);

    return gameSpec;
  };

  return {
    specs,
    createGameSpec,
  };
}
