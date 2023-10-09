import { ghinRequest, Pagination } from './ghin';

type SearchCourseRequest = {
  q: SearchCourseQuery;
};

type SearchCourseQuery = {
  name?: string;
  facility_id?: string;
  country?: string;
  state?: string;
  ent_country_code?: number;
  ent_state_code?: number;
  course_status?: string;
  facility_status?: string;
  offset?: number;
  limit?: number;
  include_tee_sets?: boolean;
  legacy_crp_course_ids?: string;
  updated_at?: string;
};

type SearchCourseResponse = {

};

export const searchCourse = async ({q}: SearchCourseRequest): Promise<SearchCourseResponse | null> => {

  // don't search unless we have at least three characters
  if (q.name.length < 3) {
    return [];
  }

  const params = {
    ...q,
  };

  const resp = await ghinRequest({
    method: 'get',
    url: `/courses/search.json`,
    params,
    data: {},
    attempts: 0,
  });

  const courses = resp?.data?.courses;
  return courses.map((c) => ({
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
  }));
};
