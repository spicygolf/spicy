import { gql } from '@apollo/client';

export default gql`
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
