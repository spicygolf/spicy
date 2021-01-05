import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client';



export const GET_GAMESPEC_QUERY = gql`
query GetGameSpec($gamespec: String!) {
  getGameSpec(_key: $gamespec) {
      _key
      name
      disp
      type
      min_players
      max_players
      location_type
      teams
      team_size
      team_determination
      team_change_every
      scoring {
          hole {
              name
              disp
              seq
              points
              source
              scope
              calculation
              better
          }
      }
      junk {
          name
          seq
          type
          value
          limit
          scope
          icon
          show_in
          score_to_par
          based_on
          calculation
          logic
          better
          availability
      }
      multipliers {
          name
          disp
          seq
          value
          icon
          based_on
          scope
          availability
          after
      }
      options {
          name
          disp
          type
          default
      }
  }
}`;
