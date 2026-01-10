import type {
  CourseDetailsRequest,
  CourseDetailsResponse,
} from "@spicygolf/ghin";
import { useQuery } from "@tanstack/react-query";
import { getMillisecondsUntilTargetTime } from "spicylib/utils";
import { apiPost } from "@/lib/api-client";

async function getCourseDetails(
  request: CourseDetailsRequest,
): Promise<CourseDetailsResponse> {
  return apiPost<CourseDetailsResponse>("/ghin/courses/details", request);
}

export function useGhinCourseDetailsQuery(request: CourseDetailsRequest) {
  // Cache until 4 AM EST
  const staleTime = getMillisecondsUntilTargetTime(
    4,
    0,
    0,
    0,
    "America/New_York",
  );

  return useQuery({
    queryKey: ["ghin-course-details", request.course_id],
    queryFn: () => getCourseDetails(request),
    enabled: !!request.course_id,
    staleTime: staleTime,
    gcTime: staleTime + 24 * 60 * 60 * 1000, // Keep in cache for 24 hours after stale
  });
}
