import React from 'react';

import { Query } from 'react-apollo';

import gql from 'graphql-tag';



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
        rating {
          all18
          front9
          back9
        }
        slope {
          all18
          front9
          back9
        }
      }
    }
  }
`;
