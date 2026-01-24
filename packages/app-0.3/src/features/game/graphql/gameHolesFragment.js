import { gql } from "@apollo/client";

// should be client/cache only
export const GAME_HOLES_FRAGMENT = gql`
  fragment gameHoles on Game {
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
        value
      }
    }
  }
`;
