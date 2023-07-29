import { gql } from '@apollo/client';

export const REMOVE_TEE_FROM_ROUND_MUTATION = gql`
  mutation removeTeeFromRound($rkey: String!, $course_id: Int, $tee_id: Int) {
    removeTeeFromRound(rkey: $rkey, course_id: $course_id, tee_id: $tee_id) {
      _key
    }
  }
`;
