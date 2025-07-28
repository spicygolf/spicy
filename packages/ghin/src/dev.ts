/** biome-ignore-all lint/correctness/noUnusedVariables: this file is for testing */

import { getCountriesAndStates } from "./getCountriesAndStates";
import { getCourse } from "./getCourse";
import { getTee } from "./getTee";
import { searchCourse } from "./searchCourse";
import { searchPlayer } from "./searchPlayer";

const callSearchPlayer = async () => {
  try {
    const resp = await searchPlayer({
      q: {
        last_name: "barrett%",
        first_name: "ken%",
        country: "US",
        state: "GA",
        status: "Active",
        sorting_criteria: "last_name_first_name",
        order: "ASC",
      },
      p: {
        page: 1,
        per_page: 50,
      },
    });
    console.log("searchPlayer", resp);
  } catch (e) {
    console.error("searchPlayer error", e);
  }
};

const callSearchCourse = async () => {
  try {
    const resp = await searchCourse({
      q: {
        name: "druid%",
        offset: 0,
        limit: 10,
        include_tee_sets: true,
        state: "US-GA",
        country: "USA",
      },
    });
    console.log("searchCourse", resp);
  } catch (e) {
    console.error("searchCourse error", e);
  }
};

const callGetCourse = async () => {
  try {
    const resp = await getCourse({
      q: {
        course_id: "13995",
      },
    });
    console.log("getCourse", resp);
  } catch (e) {
    console.error("getCourse error", e);
  }
};

const callGetTee = async () => {
  try {
    const resp = await getTee({
      q: {
        tee_id: "456824",
      },
    });
    console.log("getTee", resp);
  } catch (e) {
    console.error("getTee error", e);
  }
};

const callGetCountriesAndStates = async () => {
  try {
    const resp = await getCountriesAndStates();
    console.log("getCountriesAndStates", resp);
  } catch (e) {
    console.error("getCountriesAndStates error", e);
  }
};

const main = async () => {
  // await callSearchPlayer();
  // await callSearchCourse();
  await callGetCourse();
  // await callGetTee();
  // await callGetCountriesAndStates();
};

main();
