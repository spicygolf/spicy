import { gql, useQuery } from "@apollo/client";

const query = gql`
  query GetCourse($q: GetCourse!) {
    getCourse(q: $q) {
      course_id
      course_status
      course_name
      facility_id
      facility_status
      facility_name
      fullname
      geo_location_formatted_address
      geo_location_latitude
      geo_location_longitude
      city
      state
      country
      updated_on
      season_name
      season_start_date
      season_end_date
      is_all_year
      tees {
        tee_id
        tee_name
        gender
        total_yardage
        total_meters
        total_par
        ratings {
          rating_type
          course_rating
          slope_rating
          bogey_rating
        }
        holes {
          number
          hole_id
          length
          par
          allocation
        }
      }
    }
  }
`;

const useGetCourseQuery = (options) => {
  return useQuery(query, options);
};

export { useGetCourseQuery };
