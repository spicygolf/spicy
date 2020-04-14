import { gql } from '@apollo/client';

export const UPDATE_GAME_MUTATION = gql`
  mutation UpdateGame($gkey: String!, $game: GameInput!) {
    updateGame(gkey: $gkey, game: $game) {
      _key
      start
    }
  }
`;
