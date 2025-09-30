import { co, Group, z } from "jazz-tools";
import { ListOfGames } from "./games";
import { defaultSpec, GameSpec, ListOfGameSpecs } from "./gamespecs";
import { ListOfCountries } from "./ghin";
import { Player } from "./players";

const { JAZZ_WORKER_ACCOUNT } = process.env;
const RESET = false; // for DEV

export const PlayerAccountRoot = co.map({
  player: Player,
  games: ListOfGames,
  specs: ListOfGameSpecs,
});

export const PlayerAccountProfile = co.profile({
  name: z.string(),
  /** used by Server Worker to store countries and states from GHIN */
  countries: ListOfCountries,
  updated_at: z.date(),
});

export const PlayerAccount = co
  .account({
    root: PlayerAccountRoot,
    profile: PlayerAccountProfile,
  })
  .withMigration(async (account, creationProps?: { name: string }) => {
    if (account.root === undefined || RESET) {
      const name = creationProps?.name || "";

      if (!JAZZ_WORKER_ACCOUNT) {
        throw new Error("JAZZ_WORKER_ACCOUNT not set");
      }
      // create a group for the account, add worker as admin
      const group = Group.create(account);
      const workerAccount = await PlayerAccount.load(JAZZ_WORKER_ACCOUNT);
      if (!workerAccount) {
        throw new Error("Jazz Worker Account not found");
      }
      group.addMember(workerAccount, "admin");

      account.root = PlayerAccountRoot.create(
        {
          // TODO: make this optional? or make player search GHIN for themselves
          // upon sign up, or enter manually if they don't have a GHIN account
          player: Player.create(
            {
              name,
              short: name,
              email: "",
              gender: "M", // TODO: make this optional?
              level: "",
              handicap: undefined,
              envs: undefined,
            },
            { owner: group },
          ),
          games: ListOfGames.create([], { owner: group }),
          specs: ListOfGameSpecs.create(
            [GameSpec.create(defaultSpec, { owner: group })],
            { owner: group },
          ),
        },
        { owner: group },
      );
    }
  })
  .withMigration(async (account) => {
    if (account.id === JAZZ_WORKER_ACCOUNT) {
      if (account.profile === undefined || RESET) {
        const group = Group.create();
        group.addMember(account, "admin");
        group.makePublic();
        account.profile = PlayerAccountProfile.create(
          {
            name: "Spicy Golf Server Worker",
            countries: ListOfCountries.create([], { owner: group }),
            updated_at: new Date(1971, 8, 29),
          },
          { owner: group },
        );
        return;
      }
    }
  });
