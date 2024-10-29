import { gql } from '@apollo/client';

export const SEARCH_PLAYER_QUERY = gql`
  query SearchPlayer($q: Search!, $p: Pagination!) {
    searchPlayer(q: $q, p: $p) {
      id
      firstName
      lastName
      playerName
      gender
      active
      index
      revDate
      clubs {
        id
        name
        state
      }
    }
  }
`;
