import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client';

const query = gql`
  query GetFavoriteTeesForPlayer($pkey: String!, $gametime: String) {
    getFavoriteTeesForPlayer(pkey: $pkey, gametime: $gametime) {
      tee_id
      tee_name
      gender
      total_yardage
      total_meters
      ratings {
        rating_type
        course_rating
        slope_rating
        bogey_rating
      }
      course {
        course_id
        course_name
        course_city
        course_state
      }
    }
  }
`;

const useGetFavoriteTeesForPlayerQuery = options => {
  return useQuery(query, options);
};

export { useGetFavoriteTeesForPlayerQuery, query };
