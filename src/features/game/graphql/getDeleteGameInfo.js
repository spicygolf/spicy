import { gql } from '@apollo/client';

export const GET_DELETE_GAME_INFO_QUERY = gql`
  query GetDeleteGameInfo($gkey: String!) {
    getDeleteGameInfo(_key: $gkey) {
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
