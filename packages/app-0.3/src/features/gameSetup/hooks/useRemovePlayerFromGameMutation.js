import { gql, useMutation } from "@apollo/client";

const mutation = gql`
  mutation RemovePlayerFromGame($pkey: String!, $gkey: String!, $rkey: String!) {
    removePlayerFromGame(pkey: $pkey, gkey: $gkey, rkey: $rkey) {
      success
      _key
      message
    }
  }
`;

export const useRemovePlayerFromGameMutation = () => {
  return useMutation(mutation);
};
