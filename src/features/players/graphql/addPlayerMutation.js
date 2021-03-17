import { gql } from '@apollo/client';



export const ADD_PLAYER_MUTATION = gql`
  mutation AddPlayer($player: PlayerInput!) {
    addPlayer(player: $player) {
      _key
    }
  }
`;
