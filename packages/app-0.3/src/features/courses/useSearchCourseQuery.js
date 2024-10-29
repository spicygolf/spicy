import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client';

const query = gql`
  query SearchCourse($q: SearchCourse!) {
    searchCourse(q: $q) {
      course_id
      course_name
      facility_id
      facility_name
      city
      state
      country
      tees {
        tee_id
        tee_name
        gender
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

const useSearchCourseQuery = (options) => {
  return useQuery(query, options);
};

export { useSearchCourseQuery };
