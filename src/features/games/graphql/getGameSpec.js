import gql from 'graphql-tag';
import { useQuery } from '@apollo/react-hooks';



export const GET_GAMESPEC_QUERY = gql`
  query GetGameSpec($gamespec: String!) {
    getGameSpec(_key: $gamespec) {
      _key name type max_players min_players location_type team_size
    }
  }
`;
