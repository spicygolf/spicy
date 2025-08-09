import { ghinRequest } from "./ghin";
import type {
  ResponseCourse,
  ResponseTeeSetRating,
  SearchCourseRequest,
  SearchCourseResponse,
} from "./types";

export const searchCourse = async ({
  q,
}: SearchCourseRequest): Promise<SearchCourseResponse> => {
  // don't search unless we have at least three characters
  if (q.name && q.name.length < 3) {
    return [];
  }

  const params = {
    ...q,
  };

  const resp = await ghinRequest({
    method: "get",
    url: `/courses/search.json`,
    params,
    data: {},
    attempts: 0,
  });

  const courses = resp?.data?.courses;
  return courses.map((c: ResponseCourse) => ({
    course_id: c.CourseID,
    course_status: c.CourseStatus,
    course_name: c.CourseName,
    geo_location_latitude: c.GeoLocationLatitude,
    geo_location_longitude: c.GeoLocationLongitude,
    facility_id: c.FacilityID,
    facility_status: c.FacilityStatus,
    facility_name: c.FacilityName,
    fullname: c.FullName,
    address1: c.Address1,
    address2: c.Address2,
    city: c.City,
    state: c.State,
    country: c.Country,
    updated_on: c.UpdatedOn,
    ratings: c.Ratings.map((r: ResponseTeeSetRating) => ({
      tee_set_rating_id: r.TeeSetRatingId,
      tee_set_rating_name: r.TeeSetRatingName,
      tee_set_status: r.TeeSetStatus,
    })),
  }));
};
