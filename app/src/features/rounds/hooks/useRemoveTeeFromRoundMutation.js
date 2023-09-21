import { gql, useMutation } from '@apollo/client';

const mutation = gql`
  mutation removeTeeFromRound($rkey: String!, $course_id: Int, $tee_id: Int) {
    removeTeeFromRound(rkey: $rkey, course_id: $course_id, tee_id: $tee_id) {
      _key
    }
  }
`;

export const useRemoveTeeFromRoundMutation = () => {
  return useMutation(mutation);
};
