import { gql } from '@apollo/client';

export const UPDATE_PLAYER_MUTATION = gql`
  mutation UpdatePlayer($player: PlayerInput!) {
    updatePlayer(player: $player) {
      _key
      name
      email
      statusAuthz
      level
      short
      handicap {
        source
        id
        index
        revDate
      }
      clubs {
        _key
        name
        state
      }
    }
  }
`;
