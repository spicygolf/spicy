import React from 'react';

import { Query } from 'react-apollo';

import gql from 'graphql-tag';



export const GET_FAVORITE_TEES_FOR_PLAYER_QUERY = gql`
  query GetFavoriteTeesForPlayer($pkey: String!) {
    getFavoriteTeesForPlayer(pkey: $pkey) {
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
