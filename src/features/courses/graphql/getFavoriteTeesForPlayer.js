import React from 'react';

import { Query } from 'react-apollo';

import gql from 'graphql-tag';



export const GET_FAVORITE_TEES_FOR_PLAYER_QUERY = gql`
  query GetFavoriteTeesForPlayer($pkey: String!) {
    getFavoriteTeesForPlayer(pkey: $pkey) {
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
      course {
        _key
        name
        city
        state
      }
    }
  }
`;
