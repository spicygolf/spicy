import { gql } from '@apollo/client';

// don't put _key in here, or cache will be updated without critical data/fields
export const GAME_UPDATED_SUBSCRIPTION = gql`
  subscription onGameUpdated($gkey: String!) {
    gameUpdated(gkey: $gkey) {
      name
      start
      end
      scope {
        holes
        teams_rotate
      }
      holes {
        hole
        teams {
          team
          players
          junk {
            name
            player
            value
          }
        }
        multipliers {
          name
          team
          first_hole
        }
      }
      options {
        name
        values {
          value
          holes
        }
      }
    }
  }
`;
