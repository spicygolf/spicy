import React from 'react';

import { Query } from 'react-apollo';

import gql from 'graphql-tag';



export const GET_PLAYER_QUERY = gql`
  query GetPlayer($player: String!) {
    getPlayer(_key: $player) {
      _key
      name
      short
      handicap {
        value
        revDate
        display
        tournamentScoreCount
      }
      clubs {
        name
        state
      }
    }
  }
`;
