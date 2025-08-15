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

    // Transform the response to convert ISO date strings back to Date objects
    const golfers: Golfer[] = response.data.map((golfer: Golfer) => ({
      ...golfer,
      rev_date: golfer.rev_date ? new Date(golfer.rev_date) : null,
      low_hi_date: golfer.low_hi_date ? new Date(golfer.low_hi_date) : null,
    }));

    return golfers;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to search players: ${error.message}`);
    }
    throw error;
  }
}

export function useGhinSearchPlayerQuery(search: GolfersSearchRequest) {
  const api = useApi();

  const searchParams = {
    ...search,
    last_name: `${search.last_name}%`,
    first_name: `${search.first_name}%`,
    page: search.page || 1,
    per_page: search.per_page || 10,
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
    queryKey: ["ghin-player-search", searchParams],
    queryFn: () => searchPlayer(api, searchParams),
    // Enable when we have at least a name to search
    // TODO: put rules in place here, like at least 3 letters of last name
    //       one of last, country, state... whatever rules are in GHIN API
    enabled: !!(search.first_name || search.last_name),
    staleTime: staleTime,
    gcTime: staleTime + 24 * 60 * 60 * 1000, // Keep in cache for 24 hours after stale time
  });
}
