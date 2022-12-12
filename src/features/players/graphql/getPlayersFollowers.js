import { gql } from '@apollo/client';

export const GET_PLAYERS_FOLLOWERS_QUERY = gql`
  query getPlayersFollowers($pkey: String!) {
    getPlayersFollowers(pkey: $pkey) {
      _key
      name
      short
    }
  }
`;
