import { ghinRequest } from './ghin';
import type { GetCourseRequest, GetCourseResponse, ResponseCourse, ResponseGetCourse, ResponseRating, ResponseTee, ResponseTeeHole, ResponseTeeSetRating } from './types';
import { getGenderEnum } from './util';

export const getCourse = async ({q}: GetCourseRequest): Promise<GetCourseResponse | null> => {

  const { course_id } = q;

  const params = {
    include_altered_tees: q.include_altered_tees,
  };

  const resp = await ghinRequest({
    method: 'get',
    url: `/courses/${course_id}.json`,
    params,
    data: {},
    attempts: 0,
  });

  const c: ResponseGetCourse = resp?.data || {};
  const f = c.Facility || {};
  const s = c.Season || {};
  const ts = c.TeeSets || [];
  const ret: GetCourseResponse = {
    course_id: c.CourseId,
    course_status: c.CourseStatus,
    course_name: c.CourseName,
    facility_id: f.FacilityId,
    facility_status: f.FacilityStatus,
    facility_name: f.FacilityName,
    geo_location_formatted_address: f.GeoLocationFormattedAddress,
    geo_location_latitude: f.GeoLocationLatitude,
    geo_location_longitude: f.GeoLocationLongitude,
    city: c.CourseCity,
    state: c.CourseState,
    season_name: s.SeasonName,
    season_start_date: s.SeasonStartDate,
    season_end_date: s.SeasonEndDate,
    is_all_year: s.IsAllYear,
    tees: ts.map((t: ResponseTee) => ({
      tee_id: t.TeeSetRatingId,
      tee_name: t.TeeSetRatingName,
      gender: getGenderEnum(t.Gender),
      holes_number: t.HolesNumber,
      total_yardage: t.TotalYardage,
      total_meters: t.TotalMeters,
      total_par: t.TotalPar,
      ratings: t.Ratings?.map((r: ResponseRating) => ({
        rating_type: r.RatingType,
        course_rating: r.CourseRating,
        slope_rating: r.SlopeRating,
        bogey_rating: r.BogeyRating,
      })),
      holes: t.Holes?.map((h: ResponseTeeHole) => ({
        number: h.Number,
        hole_id: h.HoleId,
        length: h.Length,
        par: h.Par,
        allocation: h.Allocation,
      })),
      course: undefined,
    }))
  };
  return ret;
};
