import { co, Group, z } from "jazz-tools";
import { JAZZ_WORKER_ACCOUNT } from "../config/env";
import { GameCatalog } from "./catalog";
import { ListOfGameSpecCustomizations } from "./customizations";
import { ErrorLog } from "./errors";
import { Favorites } from "./favorites";
import { ListOfGames } from "./games";
import { ListOfGameSpecs, MapOfGameSpecs } from "./gamespecs";
import { Player } from "./players";

const RESET = false; // for DEV
const RESET_WORKER = false; // Catalog is now properly initialized

export const PlayerAccountRoot = co.map({
  player: Player,
  email: z.string().optional(),
  games: ListOfGames,
  specs: ListOfGameSpecs,
  favorites: co.optional(Favorites),

  // Game catalog customization features
  customSpecs: co.optional(ListOfGameSpecs), // Full custom specs (complete forks)
  specCustomizations: co.optional(ListOfGameSpecCustomizations), // Lightweight overrides
  favoriteSpecIds: co.optional(co.list(z.string())), // References to catalog specs

  // Error tracking (local-first, syncs to PostHog when online)
  errorLog: co.optional(ErrorLog),
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

      // Skip root creation for worker account
      const workerAccountId = JAZZ_WORKER_ACCOUNT();
      if (account.$jazz.id === workerAccountId) {
        // Worker account doesn't need a root
      } else {
        if (!workerAccountId) {
          throw new Error("JAZZ_WORKER_ACCOUNT not set");
        }

        // create a group for the account, add worker as admin
        const group = Group.create(account);

        const workerAccount = await PlayerAccount.load(workerAccountId);
        if (!workerAccount?.$isLoaded) {
          throw new Error("Jazz Worker Account not found");
        }
        group.addMember(workerAccount, "admin");

        const favorites = Favorites.create({}, { owner: group });

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
                  gender: "M", // TODO: make this optional?
                  handicap: undefined,
                },
                { owner: group },
              ),
              games: ListOfGames.create([], { owner: group }),
              specs: ListOfGameSpecs.create([], { owner: group }),
              favorites,
            },
            { owner: group },
          ),
        );
      }
    }

    // Migration 2: Initialize worker account profile with catalog
    if (account.$jazz.id === JAZZ_WORKER_ACCOUNT()) {
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
