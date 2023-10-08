import { ghinRequest, Pagination } from './ghin';

type GetTeeRequest = {
  q: GetTeeQuery;
};

type GetTeeQuery = {
  tee_id?: string;
};

type GetTeeResponse = {

};

export const getTee = async ({q}: GetTeeRequest): Promise<GetTeeResponse | null> => {

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

  const t = resp?.data;
  if (t) {
    const c = t.Course;
    const ret: GetTeeResponse = {
      tee_id: t.TeeSetRatingId,
      tee_name: t.TeeSetRatingName,
      gender: t.Gender,
      holes_number: t.HolesNumber,
      total_yardage: t.TotalYardage,
      total_meters: t.TotalMeters,
      total_par: t.TotalPar,
      ratings: t.Ratings,
      holes: t.Holes,
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
