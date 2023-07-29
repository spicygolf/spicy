import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client';

const query = gql`
  query GetFavoriteTeesForPlayer($pkey: String!, $gametime: String) {
    getFavoriteTeesForPlayer(pkey: $pkey, gametime: $gametime) {
      _key
      name
      gender
      TotalYardage
      TotalMeters
      Ratings {
        RatingType
        CourseRating
        SlopeRating
        BogeyRating
      }
      course {
        _key
        name
        city
        state
      }
    }
  }
`;

const useGetFavoriteTeesForPlayerQuery = (options) => {
  return useQuery(query, options);
};

export { useGetFavoriteTeesForPlayerQuery, query };
