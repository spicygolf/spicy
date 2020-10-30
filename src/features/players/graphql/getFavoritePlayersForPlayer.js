import { gql } from '@apollo/client';



export const GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY = gql`
  query GetFavoritePlayersForPlayer($pkey: String!) {
    getFavoritePlayersForPlayer(pkey: $pkey) {
      _key
      name
      short
      handicap {
        index
        revDate
      }
      clubs {
        _key
        name
        state
      }
    }
  }
`;
