import type { GolfersSearchRequest } from "@spicygolf/ghin";
import { useState } from "react";
import {
  defaultState,
  GhinPlayerSearchContext,
} from "@/contexts/GhinPlayerSearchContext";
import { GhinPlayerSearchInput } from "./SearchInput";
import { GhinPlayerSearchResults } from "./SearchResults";

export function GhinPlayerSearch() {
  const [state, setState] = useState<GolfersSearchRequest>(defaultState);

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
