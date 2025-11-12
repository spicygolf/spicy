import type {
  CourseDetailsRequest,
  CourseDetailsResponse,
  CourseSearchRequest,
  CourseSearchResponse,
} from "@spicygolf/ghin";
import { GhinClient } from "@spicygolf/ghin";

const { GHIN_BASE_URL, GHIN_USERNAME, GHIN_PASSWORD } = process.env;

export async function searchCourses(
  search: CourseSearchRequest,
): Promise<CourseSearchResponse> {
  if (!GHIN_USERNAME || !GHIN_PASSWORD) {
    throw new Error("GHIN_USERNAME or GHIN_PASSWORD not set");
  }

  const ghin = new GhinClient({
    username: GHIN_USERNAME,
    password: GHIN_PASSWORD,
    apiAccess: true,
    baseUrl: GHIN_BASE_URL,
  });

  const response = await ghin.courses.search(search);
  return { courses: response };
}

export async function getCourseDetails(
  request: CourseDetailsRequest,
): Promise<CourseDetailsResponse> {
  if (!GHIN_USERNAME || !GHIN_PASSWORD) {
    throw new Error("GHIN_USERNAME or GHIN_PASSWORD not set");
  }

  const ghin = new GhinClient({
    username: GHIN_USERNAME,
    password: GHIN_PASSWORD,
    apiAccess: true,
    baseUrl: GHIN_BASE_URL,
  });

  console.log("Calling ghin.courses.getDetails with request:", request);
  const response = await ghin.courses.getDetails(request);
  console.log(
    "Raw GHIN response Facility.GeoLocationFormattedAddress:",
    response.Facility.GeoLocationFormattedAddress,
  );
  console.log(
    "Response type:",
    typeof response.Facility.GeoLocationFormattedAddress,
  );
  return response;
}
