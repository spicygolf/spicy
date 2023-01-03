import { gql } from '@apollo/client';

export const SEARCH_COURSE_QUERY = gql`
  query SearchCourse($q: String!) {
    searchCourse(q: $q) {
      _key
      name
      city
      state
      tees {
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
      }
    }
  }
`;
