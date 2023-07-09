import { gql } from '@apollo/client';

export const ADD_TEE_TO_ROUND_MUTATION = gql`
  mutation addTeeToRound($rkey: String!, $course_id: Int, $tee_id: Int) {
    addTeeToRound(rkey: $rkey, course_id: $course_id, tee_id: $tee_id) {
      _key
    }
  }
`;
