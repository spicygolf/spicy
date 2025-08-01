import { co, Group, z } from "jazz-tools";
import { ListOfGames } from "./games";
import { defaultSpec, GameSpec, ListOfGameSpecs } from "./gamespecs";
import { Country, ListOfCountries, ListOfStates, State } from "./ghin";
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
  .withMigration((account, creationProps?: { name: string }) => {
    if (account.root === undefined) {
      const name = creationProps?.name || "";
      const gsGroup = Group.create();
      gsGroup.addMember(account, "writer");
      account.root = PlayerAccountRoot.create(
        {
          player: Player.create(
            {
              name,
              short: name,
              email: "",
              level: "",
              handicap: undefined,
              envs: undefined,
            },
            { owner: account },
          ),
          games: ListOfGames.create([], { owner: account }),
          specs: ListOfGameSpecs.create(
            [GameSpec.create(defaultSpec, { owner: gsGroup })],
            { owner: account },
          ),
        },
        { owner: account },
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
            countries: await getCountries(group),
            updated_at: new Date(),
          },
          { owner: group },
        );
        return;
      }

      if (profileNeedsUpdate(account.profile) && account.profile !== null) {
        account.profile.countries = await getCountries(
          account.profile._owner as Group,
        );
        account.profile.updated_at = new Date();
      }
    }
  });

type ListOfCountriesType = co.loaded<typeof ListOfCountries>;

// Local type definitions that match the ghin package types
// without importing the ghin package (due to app being RN)
type GhinState = {
  name?: string;
  code?: string;
  course_code?: string;
};

type GhinCountry = {
  name?: string;
  code?: string;
  crs_code?: string;
  states?: GhinState[];
};

async function getCountriesFromAPI(): Promise<GhinCountry[]> {
  const { API_SCHEME, API_HOST, API_PORT, API_VERSION } = process.env;
  const baseUrl = `${API_SCHEME}://${API_HOST}:${API_PORT}/${API_VERSION}`;

  try {
    const response = await fetch(`${baseUrl}/ghin/countries`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = (await response.json()) as GhinCountry[];
    if (!data || data.length === 0) {
      throw new Error("Failed to get GHIN countries and states from API");
    }
    return data;
  } catch (error) {
    console.error("Error fetching countries from API:", error);
    throw error;
  }
}

async function getCountries(group: Group): Promise<ListOfCountriesType> {
  const data = await getCountriesFromAPI();

  const listOfCountries = ListOfCountries.create([], { owner: group });

  for (const countryData of data as GhinCountry[]) {
    if (!countryData.code || !countryData.name) continue;

    // Check if country already exists by code
    const existingCountry = listOfCountries.find(
      (c) => c?.code === countryData.code,
    );

    if (!existingCountry) {
      // Create states list for this country
      const statesForCountry = ListOfStates.create([], { owner: group });

      // Process states for this country
      if (countryData.states) {
        for (const stateData of countryData.states) {
          if (!stateData.code || !stateData.name) continue;

          // Check if state already exists by code
          const existingState = statesForCountry.find(
            (s) => s?.code === stateData.code,
          );

          if (!existingState) {
            // Create new state
            const newState = State.create(
              {
                name: stateData.name,
                code: stateData.code,
                course_code: stateData.course_code || "",
              },
              { owner: group },
            );

            statesForCountry.push(newState);
          }
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
        { owner: group },
      );

      listOfCountries.push(newCountry);
    } else {
      // Country exists, update its states if needed
      if (countryData.states) {
        for (const stateData of countryData.states) {
          if (!stateData.code || !stateData.name) continue;

          // Check if state already exists in the existing country
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
              { owner: group },
            );

            existingCountry.states.push(newState);
          }
        }
      }
    }
  }

  return listOfCountries;
}

type PlayerAccountProfileType = co.loaded<typeof PlayerAccountProfile>;

function profileNeedsUpdate(
  profile: PlayerAccountProfileType | undefined | null,
): boolean {
  if (!profile) return true;
  const now = new Date();
  const lastUpdated = profile.updated_at;
  if (!lastUpdated) return true;
  const diff = now.getTime() - lastUpdated.getTime();
  // return diff > 24 * 60 * 60 * 1000; // 24 hours
  return diff > 10 * 1000; // 10 seconds for DEV
}
