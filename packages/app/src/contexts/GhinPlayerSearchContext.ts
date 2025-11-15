import type { GolfersSearchRequest } from "@spicygolf/ghin";
import { createContext } from "react";

interface GhinPlayerSearchContextType {
  state: GolfersSearchRequest;
  setState: (state: GolfersSearchRequest) => void;
}

export const defaultState: GolfersSearchRequest = {
  country: "USA",
  state: "",
  first_name: "",
  last_name: "Smith",
  status: "Active",
  sorting_criteria: "last_name_first_name",
  order: "asc",
};

export const GhinPlayerSearchContext =
  createContext<GhinPlayerSearchContextType>({
    state: defaultState,
    setState: () => {},
  });
