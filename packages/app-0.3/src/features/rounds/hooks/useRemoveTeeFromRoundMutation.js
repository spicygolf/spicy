import { gql, useMutation } from "@apollo/client";

const mutation = gql`
  mutation removeTeeFromRound($rkey: String!, $tee_id: Int) {
    removeTeeFromRound(rkey: $rkey, tee_id: $tee_id) {
      _key
    }
  }
`;

export const useRemoveTeeFromRoundMutation = () => {
  return useMutation(mutation);
};
