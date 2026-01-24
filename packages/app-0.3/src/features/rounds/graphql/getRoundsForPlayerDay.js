import { gql } from "@apollo/client";

export const GET_ROUNDS_FOR_PLAYER_DAY_QUERY = gql`
  query GetRoundsForPlayerDay($pkey: String!, $day: String!) {
    getRoundsForPlayerDay(pkey: $pkey, day: $day) {
      _key
      date
      seq
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
