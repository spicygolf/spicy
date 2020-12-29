import { gql } from '@apollo/client';



export const GET_FAVORITE_TEES_FOR_PLAYER_QUERY = gql`
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
