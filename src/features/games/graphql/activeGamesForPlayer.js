import { gql } from '@apollo/client';

export default gql`
  query ActiveGamesForPlayer($pkey: String!) {
    activeGamesForPlayer(pkey: $pkey) {
      _key
      name
      start
      end
      rounds {
        player {
          name
          short
        }
        tee {
          name
          course {
            name
          }
        }
      }
    }
  }
`;
