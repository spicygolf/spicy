import { gql } from '@apollo/client';

export const ADD_GAME_MUTATION = gql`
  mutation AddGame($game: GameInput!) {
    addGame(game: $game) {
      _key
      start
    }
  }
`;
