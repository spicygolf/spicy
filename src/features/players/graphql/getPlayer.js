import React from 'react';

import { Query } from 'react-apollo';

import gql from 'graphql-tag';



export const GET_PLAYER_QUERY = gql`
  query GetPlayer($player: String!) {
    getPlayer(_key: $player) {
      _key
      name
      statusAuthz
      short
      handicap {
        index
        revDate
      }
      clubs {
        name
        state
      }
    }
  }
`;
