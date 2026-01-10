import type {
  CourseSearchRequest,
  CourseSearchResponse,
} from "@spicygolf/ghin";
import { useQuery } from "@tanstack/react-query";
import { getMillisecondsUntilTargetTime } from "spicylib/utils";
import { apiPost } from "@/lib/api-client";

async function searchCourses(
  search: CourseSearchRequest,
): Promise<CourseSearchResponse> {
  // Filter out empty string values to avoid validation errors
  const cleanedSearch = Object.fromEntries(
    Object.entries(search).filter(([_, value]) => value !== ""),
  ) as CourseSearchRequest;

  return apiPost<CourseSearchResponse>("/ghin/courses/search", cleanedSearch);
}

export function useGhinSearchCourseQuery(search: CourseSearchRequest) {
  // Cache until 4 AM EST
  const staleTime = getMillisecondsUntilTargetTime(
    4,
    0,
    0,
    0,
    "America/New_York",
  );

  return useQuery({
    queryKey: ["ghin-course-search", search],
    queryFn: () => searchCourses(search),
    // Require at least 2 characters in course name before searching
    // State is now optional, but country is still required
    enabled:
      !!search.country &&
      !!search.name &&
      search.name.length >= 2 &&
      !search.facility_id,
    staleTime: staleTime,
    gcTime: staleTime + 24 * 60 * 60 * 1000, // Keep in cache for 24 hours after stale
  });
}
