import { gql } from "@apollo/client";

export const GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY = gql`
  query GetFavoritePlayersForPlayer($pkey: String!) {
    getFavoritePlayersForPlayer(pkey: $pkey) {
      _key
      name
      short
      handicap {
        source
        id
        index
        revDate
        clubs {
          name
          state
        }
      }
    }
  }
`;

export const GET_FAVORITE_PLAYERS_FOR_PLAYER_STATS_QUERY = gql`
  query GetFavoritePlayersForPlayer($pkey: String!) {
    getFavoritePlayersForPlayer(pkey: $pkey) {
      _key
      name
      short
    }
  }
`;
