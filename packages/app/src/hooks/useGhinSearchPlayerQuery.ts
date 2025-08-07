import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { Golfer, GolfersSearchRequest } from "ghin";
import { getMillisecondsUntilTargetTime } from "spicylib/utils";
import { useApi } from "@/hooks";

// Function to search players via API
async function searchPlayer(
  api: string,
  search: GolfersSearchRequest,
): Promise<Golfer[]> {
  try {
    const response = await axios.post(`${api}/ghin/players/search`, search, {
      headers: {
        "Content-Type": "application/json",
      },
      // withCredentials: true, // Include cookies for authentication
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to search players: ${error.message}`);
    }
    throw error;
  }
}

// Custom hook for GHIN player search
export function useGhinSearchPlayerQuery(search: GolfersSearchRequest) {
  const api = useApi();
  // add wildcards to names
  search.last_name = `${search.last_name}%`;
  search.first_name = `${search.first_name}%`;

  // Calculate stale time to expire at next 4:00 AM EST
  const staleTime = getMillisecondsUntilTargetTime(
    4,
    0,
    0,
    0,
    "America/New_York",
  );

  return useQuery({
    queryKey: ["ghin-player-search", search],
    queryFn: () => searchPlayer(api, search),
    // Enable when we have at least a name to search
    // TODO: put rules in place here, like at least 3 letters of last name
    //       one of last, country, state... whatever rules are in GHIN API
    enabled: !!(search.first_name || search.last_name),
    staleTime: staleTime,
    gcTime: staleTime + 24 * 60 * 60 * 1000, // Keep in cache for 24 hours after stale time
  });
}
