import { gql, useMutation } from '@apollo/client';

const mutation = gql`
  mutation addTeeToRound(
    $rkey: String!
    $course_id: Int
    $tee_id: Int
    $course_handicap: Int
  ) {
    addTeeToRound(
      rkey: $rkey
      course_id: $course_id
      tee_id: $tee_id
      course_handicap: $course_handicap
    ) {
      _key
    }
  }
`;

export const useAddTeeToRoundMutation = () => {
  return useMutation(mutation);
};
