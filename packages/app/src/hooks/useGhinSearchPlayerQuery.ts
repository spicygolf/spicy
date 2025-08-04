import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getMillisecondsUntilTargetTime } from "spicylib/utils";
import type { GhinPlayerSearchState } from "@/contexts/GhinPlayerSearchContext";
import { useApi } from "@/hooks";

// TODO: these types were in ghin, but RN can't import ghin package
// shared types in lib?
export type Pagination = {
  page: number;
  per_page: number;
};

export enum Gender {
  Male = "Male",
  Female = "Female",
}

type SearchPlayerResponse = {
  ghin?: string;
  first_name?: string;
  last_name?: string;
  player_name?: string;
  club_name?: string;
  club_id?: number;
  city?: string;
  state?: string;
  country?: string;
  is_home_club?: boolean;
  gender: Gender;
  status?: string;
  handicap_index?: string;
  hi_value?: number;
  hi_display?: string;
  rev_date?: string;
};

// Types for the search parameters
interface SearchParams {
  q: GhinPlayerSearchState;
  p: Pagination;
}

// Function to search players via API
async function searchPlayer(
  api: string,
  { q, p }: SearchParams,
): Promise<SearchPlayerResponse[]> {
  try {
    const response = await axios.post(
      `${api}/ghin/players/search`,
      { q, p },
      {
        headers: {
          "Content-Type": "application/json",
        },
        // withCredentials: true, // Include cookies for authentication
      },
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to search players: ${error.message}`);
    }
    throw error;
  }
}

// Custom hook for GHIN player search
export function useGhinSearchPlayerQuery(
  searchState: SearchParams["q"],
  page: number,
  per_page: number = 25,
) {
  const api = useApi();
  // add wildcards to names
  const q = {
    ...searchState,
    last_name: `${searchState.last_name}%`,
    first_name: `${searchState.first_name}%`,
  };
  const searchParams: SearchParams = {
    q,
    p: { page, per_page },
  };

  // Calculate stale time to expire at next 4:00 AM EST
  const staleTime = getMillisecondsUntilTargetTime(
    4,
    0,
    0,
    0,
    "America/New_York",
  );

  return useQuery({
    queryKey: ["ghin-player-search", searchState, page],
    queryFn: () => searchPlayer(api, searchParams),
    enabled: !!(searchState.first_name || searchState.last_name), // Enable when we have at least a name to search
    staleTime: staleTime,
    gcTime: staleTime + 24 * 60 * 60 * 1000, // Keep in cache for 24 hours after stale time
  });
}
