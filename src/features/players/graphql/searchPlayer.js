import { gql } from '@apollo/client';



export const SEARCH_PLAYER_QUERY = gql`
  query SearchPlayer($q: String!) {
    searchPlayer(q: $q) {
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
