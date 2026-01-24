import { ghinRequest } from "./ghin";

export const getCountriesAndStates = async (): Promise<object[] | null> => {
  const resp = await ghinRequest({
    method: "get",
    url: "/get_countries_and_states.json",
    attempts: 0,
  });

  return resp?.data?.countries || [];
};
