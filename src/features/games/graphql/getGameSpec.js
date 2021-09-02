import { gql } from '@apollo/client';

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
      options {
        name
        disp
        seq
        type
        sub_type
        choices {
          name
          disp
        }
        default
        limit
        scope
        icon
        show_in
        score_to_par
        based_on
        calculation
        availability
        logic
        better
        after
        values {
          value
          holes
        }
      }
    }
  }
`;
