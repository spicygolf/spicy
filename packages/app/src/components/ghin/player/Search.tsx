import { useState } from "react";
import {
  defaultState,
  GhinPlayerSearchContext,
  type GhinPlayerSearchState,
} from "@/contexts/GhinPlayerSearchContext";
import { GhinPlayerSearchInput } from "./SearchInput";
import { GhinPlayerSearchResults } from "./SearchResults";

export function GhinPlayerSearch() {
  const [state, setState] = useState<GhinPlayerSearchState>(defaultState);

  return (
    <GhinPlayerSearchContext.Provider
      value={{
        state,
        setState,
      }}
    >
      <GhinPlayerSearchInput />
      <GhinPlayerSearchResults />
    </GhinPlayerSearchContext.Provider>
  );
}
