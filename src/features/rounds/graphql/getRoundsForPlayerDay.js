import React from 'react';

import { Query } from 'react-apollo';

import gql from 'graphql-tag';



export const GET_ROUNDS_FOR_PLAYER_DAY_QUERY = gql`
  query GetRoundsForPlayerDay($pkey: String!, $day: String!) {
    getRoundsForPlayerDay(pkey: $pkey, day: $day) {
      _key
      date
      seq
    }
  }
`;
