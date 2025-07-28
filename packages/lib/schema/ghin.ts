import { co, z } from "jazz-tools";

export const State = co.map({
  name: z.string(),
  code: z.string(),
  course_code: z.string(),
});

export const ListOfStates = co.list(State);

export const Country = co.map({
  name: z.string(),
  code: z.string(),
  crs_code: z.string(),
  states: ListOfStates,
});

export const ListOfCountries = co.list(Country);
