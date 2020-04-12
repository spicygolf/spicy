import gql from 'graphql-tag';

export const DELETE_GAME_MUTATION = gql`
  mutation DeleteGame($gkey: String!) {
    deleteGame(gkey: $gkey) {
      _key
    }
  }
`;
