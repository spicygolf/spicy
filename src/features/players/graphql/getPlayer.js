import { gql } from '@apollo/client';



export const GET_PLAYER_QUERY = gql`
  query GetPlayer($player: String!) {
    getPlayer(_key: $player) {
      _key
      name
      statusAuthz
      level
      short
      handicap {
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
