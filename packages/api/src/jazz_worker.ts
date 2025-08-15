import type { Account, co } from "jazz-tools";
import { Group } from "jazz-tools";
import { startWorker } from "jazz-tools/worker";
import {
  Country,
  ListOfCountries,
  ListOfStates,
  PlayerAccount,
  type PlayerAccountProfile,
  State,
} from "spicylib/schema";
import { getCountries } from "./countries";

let workerInstance: Awaited<ReturnType<typeof startWorker>> | null = null;

export async function getJazzWorker(): Promise<{
  id: string;
  account: Account;
  done: () => Promise<void>;
}> {
  if (workerInstance) {
    return {
      id: workerInstance.worker.id,
      account: workerInstance.worker,
      done: workerInstance.done,
    };
  }

  try {
    workerInstance = await startWorker({
      AccountSchema: PlayerAccount,
      syncServer: "wss://cloud.jazz.tools/?key=spicy-dev@druid.golf",
      accountID: process.env.JAZZ_WORKER_ACCOUNT,
      accountSecret: process.env.JAZZ_WORKER_SECRET,
    });

    // Load the account with full resolve query for nested CoValues
    const fullyLoadedAccount = await PlayerAccount.load(
      workerInstance.worker.id,
      {
        resolve: {
          profile: {
            countries: {
              $each: {
                states: {
                  $each: true,
                },
              },
            },
          },
        },
      },
    );

    if (!fullyLoadedAccount) {
      throw new Error("Failed to load worker account with nested data");
    }

    console.log("Jazz worker initialized:", workerInstance.worker.id);
    return {
      id: workerInstance.worker.id,
      account: fullyLoadedAccount,
      done: workerInstance.done,
    };
  } catch (error) {
    console.error("Failed to start Jazz worker:", error);
    throw error;
  }
}
type LoadedPlayerAccountProfile = co.loaded<
  typeof PlayerAccountProfile,
  {
    countries: {
      $each: {
        states: {
          $each: true;
        };
      };
    };
  }
>;

async function refreshCountriesAndStates(account: Account) {
  try {
    console.log("Refreshing countries and states data...");

    // Check if profile.countries needs update
    const profile = account.profile as LoadedPlayerAccountProfile | null;
    if (!profile) {
      console.log("No profile found, skipping countries refresh");
      return;
    }

    // Initialize countries list only if missing (following accounts.ts pattern)
    if (profile.countries === undefined) {
      console.log("Initializing countries list");
      const group = Group.create();
      group.addMember(account, "admin");
      group.makePublic();
      profile.countries = ListOfCountries.create([], { owner: group });
    }

    const now = new Date();
    const lastUpdated = profile.updated_at;
    const needsUpdate =
      !lastUpdated ||
      now.getTime() - lastUpdated.getTime() > 24 * 60 * 60 * 1000; // 24 hours

    if (needsUpdate) {
      console.log("Updating countries and states data");
      const countriesData = await getCountries();

      for (const countryData of countriesData) {
        if (!countryData.code || !countryData.name) continue;

        // Check if country already exists by code
        const existingCountry = profile.countries.find(
          (c) => c?.code === countryData.code,
        );

        if (!existingCountry) {
          // Create states list for this country
          const statesForCountry = ListOfStates.create([], {
            owner: profile.countries._owner,
          });

          // Process states for this country
          if (countryData.states) {
            for (const stateData of countryData.states) {
              if (!stateData.code || !stateData.name) continue;

              // Create new state
              const newState = State.create(
                {
                  name: stateData.name,
                  code: stateData.code,
                  course_code: stateData.course_code || "",
                },
                { owner: profile.countries._owner },
              );

              statesForCountry.push(newState);
            }
          }

          // Create new country
          const newCountry = Country.create(
            {
              name: countryData.name,
              code: countryData.code,
              crs_code: countryData.crs_code || "",
              states: statesForCountry,
            },
            { owner: profile.countries._owner },
          );

          profile.countries.push(newCountry);
        } else {
          // Country exists, update its states if needed
          if (countryData.states) {
            for (const stateData of countryData.states) {
              if (!stateData.code || !stateData.name) continue;

              // Check if state already exists by code
              const existingState = existingCountry.states?.find(
                (s) => s?.code === stateData.code,
              );

              if (!existingState && existingCountry.states) {
                // Create new state and add to existing country
                const newState = State.create(
                  {
                    name: stateData.name,
                    code: stateData.code,
                    course_code: stateData.course_code || "",
                  },
                  { owner: profile.countries._owner },
                );

                existingCountry.states.push(newState);
              }
            }
          }
        }
      }

      profile.updated_at = new Date();
      console.log("Countries and states data updated successfully");
    } else {
      console.log("Countries and states data is up to date");
    }
  } catch (error) {
    console.error("Failed to refresh countries and states:", error);
  }
}

export async function setupWorker() {
  const { id, account } = await getJazzWorker();
  console.log("worker.id", id);
  console.log("worker.profile", account.profile);

  // Refresh countries and states data at startup
  await refreshCountriesAndStates(account);
}
