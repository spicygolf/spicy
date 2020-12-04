import { gql } from '@apollo/client';

// should be client/cache only
export const GET_ROUND_QUERY = gql`
  query GetRound($rkey: String!) {
    getRound(rkey: $rkey) {
      _key
      date
      seq
      handicap_index
      game_handicap
      course_handicap
      scores {
        hole
        values {
          k
          v
          ts
        }
        pops
      }
      posting {
        id
        adjusted_gross_score
        differential
        date_validated
        exceptional
        posted_by
        success
        messages
      }
      player {
        _key
        name
        handicap {
          index
          revDate
        }
      }
      tee {
        _key
        name
        gender
        Ratings {
          RatingType
          CourseRating
          SlopeRating
          BogeyRating
        }
        assigned
        course {
          _key
          name
        }
        holes {
          hole
          length
          par
          handicap
          seq
        }
      }
    }
  }
`;
