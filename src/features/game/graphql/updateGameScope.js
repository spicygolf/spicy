import { gql } from '@apollo/client';



export const UPDATE_GAME_SCOPE_MUTATION = gql`
  mutation UpdateGameScope($gkey: String!, $scope: GameScopeInput!) {
    updateGameScope(gkey: $gkey, scope: $scope) {
      _key
      scope  {
        holes
        teams_rotate
      }
    }
  }
`;
