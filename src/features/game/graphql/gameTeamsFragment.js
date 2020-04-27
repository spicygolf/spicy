import { gql } from '@apollo/client';

// should be client/cache only
export const GAME_TEAMS_FRAGMENT = gql`
  fragment gameTeams on Game {
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
`;
