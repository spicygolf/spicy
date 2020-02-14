import gql from 'graphql-tag';
import { useQuery } from '@apollo/react-hooks';



export const GET_GAMESPEC_QUERY = gql`
query GetGameSpec($gamespec: String!) {
  getGameSpec(_key: $gamespec) {
      _key
      name
      type
      min_players
      max_players
      location_type
      team_size
      team_determination
      team_change_every
      scoring {
          hole {
              name
              points
              source
              type
              scope
              based_on
          }
      }
      junk {
          name
          seq
          type
          limit
          scope
          icon
          show_in
      }
      options {
          name
          disp
          type
          default
      }
  }
}`;
