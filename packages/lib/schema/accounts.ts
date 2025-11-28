import { co, Group, z } from "jazz-tools";
import { GameCatalog } from "./catalog";
import { ListOfGameSpecCustomizations } from "./customizations";
import { Favorites } from "./favorites";
import { ListOfGames } from "./games";
import { ListOfGameSpecs, MapOfGameSpecs } from "./gamespecs";
import { Player } from "./players";

// Support both React Native (process.env) and web (import.meta.env)
const JAZZ_WORKER_ACCOUNT =
  (typeof process !== "undefined" && process.env?.JAZZ_WORKER_ACCOUNT) ||
  (typeof import.meta !== "undefined" &&
    (import.meta as { env?: { VITE_JAZZ_WORKER_ACCOUNT?: string } }).env
      ?.VITE_JAZZ_WORKER_ACCOUNT) ||
  undefined;

const RESET = false; // for DEV
const RESET_WORKER = false; // Catalog is now properly initialized

export const PlayerAccountRoot = co.map({
  player: Player,
  games: ListOfGames,
  specs: ListOfGameSpecs,
  favorites: co.optional(Favorites),

  // Game catalog customization features
  customSpecs: co.optional(ListOfGameSpecs), // Full custom specs (complete forks)
  specCustomizations: co.optional(ListOfGameSpecCustomizations), // Lightweight overrides
  favoriteSpecIds: co.optional(co.list(z.string())), // References to catalog specs
});

export const PlayerAccountProfile = co.profile({
  name: z.string(),
  catalog: co.optional(GameCatalog), // Public catalog for worker account
});
export type PlayerAccountProfile = co.loaded<typeof PlayerAccountProfile>;

export const PlayerAccount = co
  .account({
    root: PlayerAccountRoot,
    profile: PlayerAccountProfile,
  })
  .withMigration(async (account, creationProps?: { name: string }) => {
    // Migration 1: Create root for regular user accounts
    if (!account.$jazz.has("root") || RESET) {
      const name = creationProps?.name || "";

      // Skip this migration for worker account - it has its own migration
      if (account.$jazz.id === JAZZ_WORKER_ACCOUNT) {
        return;
      }

      if (!JAZZ_WORKER_ACCOUNT) {
        throw new Error("JAZZ_WORKER_ACCOUNT not set");
      }
      // create a group for the account, add worker as admin
      const group = Group.create(account);
      const workerAccount = await PlayerAccount.load(JAZZ_WORKER_ACCOUNT);
      if (!workerAccount?.$isLoaded) {
        throw new Error("Jazz Worker Account not found");
      }
      group.addMember(workerAccount, "admin");

      account.$jazz.set(
        "root",
        PlayerAccountRoot.create(
          {
            // TODO: make this optional? or make player search GHIN for themselves
            // upon sign up, or enter manually if they don't have a GHIN account
            player: Player.create(
              {
                name,
                short: name,
                email: "",
                gender: "M", // TODO: make this optional?
                handicap: undefined,
                envs: undefined,
              },
              { owner: group },
            ),
            games: ListOfGames.create([], { owner: group }),
            specs: ListOfGameSpecs.create([], { owner: group }),
          },
          { owner: group },
        ),
      );
    }
  })
  .withMigration(async (account) => {
    // Migration 2: Initialize worker account profile with catalog
    if (account.$jazz.id === JAZZ_WORKER_ACCOUNT) {
      if (!account.$jazz.has("profile") || RESET || RESET_WORKER) {
        const group = Group.create();
        group.addMember(account, "admin");
        group.makePublic();

        const profile = PlayerAccountProfile.create(
          {
            name: "Spicy Golf Server Worker",
          },
          { owner: group },
        );

        account.$jazz.set("profile", profile);

        // Create catalog in profile (public)
        const catalogGroup = Group.create(account);
        catalogGroup.makePublic();

        const catalog = GameCatalog.create(
          {
            specs: MapOfGameSpecs.create({}, { owner: catalogGroup }),
          },
          { owner: catalogGroup },
        );

        profile.$jazz.set("catalog", catalog);
      }
    }
  });
