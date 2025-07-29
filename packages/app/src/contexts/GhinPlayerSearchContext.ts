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
}

export const defaultState: GhinPlayerSearchState = {
  country: "USA",
  state: "",
  first_name: "",
  last_name: "",
  status: "Active",
};

export const GhinPlayerSearchContext =
  createContext<GhinPlayerSearchContextType>({
    state: defaultState,
    setState: () => {},
  });
