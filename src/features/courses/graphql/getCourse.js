import { gql } from '@apollo/client';

export const GET_COURSE_QUERY = gql`
  query GetCourse($courseKey: String!) {
    getCourse(courseKey: $courseKey) {
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
