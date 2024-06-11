import { ghinRequest } from './ghin';
import { Gender } from './types';
import type {
  GetTeeRequest,
  GetTeeResponse,
  ResponseRating,
  ResponseTee,
  ResponseTeeCourse,
  ResponseTeeHole,
  TeeSet
} from './types';
import { getGenderEnum } from './util';

export const getTee = async ({q}: GetTeeRequest): Promise<GetTeeResponse> => {

  const { tee_id } = q;

  const params = {
    include_altered_tees: true,
  };

  const resp = await ghinRequest({
    method: 'get',
    url: `/TeeSetRatings/${tee_id}.json`,
    params,
    data: {},
    attempts: 0,
  });

  const t: ResponseTee = resp?.data;
  if (t) {
    const c: ResponseTeeCourse = t.Course || {};
    const ret: TeeSet = {
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
      course: {
        course_id: c.CourseId,
        course_status: c.CourseStatus,
        course_name: c.CourseName,
        course_number: c.CourseNumber,
        course_city: c.CourseCity,
        course_state: c.CourseState,
      },
    };
    return ret;
  }
  return {};
};
