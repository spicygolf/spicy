import { createContext } from "react";

interface GhinPlayerSearchContextType {
  state: GhinPlayerSearchState;
  setState: (state: GhinPlayerSearchState) => void;
}

export interface GhinPlayerSearchState {
  country: string;
  state: string;
  first_name: string;
  last_name: string;
  status: "Active" | "Inactive";
  sorting_criteria?: "last_name_first_name" | "first_name_last_name";
  order?: "ASC" | "DESC";
}

export const defaultState: GhinPlayerSearchState = {
  country: "USA",
  state: "GA",
  first_name: "",
  last_name: "Smith",
  status: "Active",
  sorting_criteria: "last_name_first_name",
  order: "ASC",
};

export const GhinPlayerSearchContext =
  createContext<GhinPlayerSearchContextType>({
    state: defaultState,
    setState: () => {},
  });
