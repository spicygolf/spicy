import gql from 'graphql-tag';

export const GET_DELETE_GAME_INFO_QUERY = gql`
  query GetGame($game: String!) {
    getGame(_key: $game) {
        _key
        deleteGameInfo {
            rounds {
                vertex
                edge
                other
            }
            players {
                vertex
                edge
                other
            }
            gamespecs {
                vertex
                edge
                other
            }
        }
    }
  }
`;
