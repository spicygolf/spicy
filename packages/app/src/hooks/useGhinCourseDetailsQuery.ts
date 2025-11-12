import type {
  CourseDetailsRequest,
  CourseDetailsResponse,
} from "@spicygolf/ghin";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getMillisecondsUntilTargetTime } from "spicylib/utils";
import { useApi } from "@/hooks/useApi";

async function getCourseDetails(
  api: string,
  request: CourseDetailsRequest,
): Promise<CourseDetailsResponse> {
  const response = await axios.post(`${api}/ghin/courses/details`, request, {
    headers: { "Content-Type": "application/json" },
  });

  return response.data;
}

export function useGhinCourseDetailsQuery(request: CourseDetailsRequest) {
  const api = useApi();
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
    queryFn: () => getCourseDetails(api, request),
    enabled: !!request.course_id,
    staleTime: staleTime,
    gcTime: staleTime + 24 * 60 * 60 * 1000, // Keep in cache for 24 hours after stale
  });
}
