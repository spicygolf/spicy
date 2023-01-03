import { gql } from '@apollo/client';

export const DELETE_GAME_MUTATION = gql`
  mutation DeleteGame($gkey: String!) {
    deleteGame(gkey: $gkey) {
      _key
    }
  }
`;
