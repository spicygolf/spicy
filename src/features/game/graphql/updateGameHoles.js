import { gql } from '@apollo/client';

export const UPDATE_GAME_HOLES_MUTATION = gql`
  mutation UpdateGameHoles($gkey: String!, $holes: [GameHoleInput]!) {
    updateGameHoles(gkey: $gkey, holes: $holes) {
      _key
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
    }
  }
`;
