import { ghinRequest } from "./ghin";
import type { GetCountriesAndStatesResponse } from "./types";

export const getCountriesAndStates = async (): Promise<object[] | null> => {
  const resp = await ghinRequest({
    method: "get",
    url: "/get_countries_and_states.json",
    attempts: 0,
  });

  const countriesAndStates: GetCountriesAndStatesResponse =
    resp?.data?.countries || [];
  return countriesAndStates;
};
