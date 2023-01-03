import { gql } from '@apollo/client';

export default gql`
  query ActiveGamesForPlayer($pkey: String!) {
    activeGamesForPlayer(pkey: $pkey) {
      _key
      name
      start
      end
      scope {
        holes
        teams_rotate
        wolf_order
      }
      rounds {
        _key
        player {
          _key
          name
          short
        }
        tee {
          _key
          name
          course {
            _key
            name
          }
        }
      }
    }
  }
`;
