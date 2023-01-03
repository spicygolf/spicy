import { gql } from '@apollo/client';

export const POST_ROUND_MUTATION = gql`
  mutation PostRoundToHandicapService($rkey: String!, $posted_by: String!) {
    postRoundToHandicapService(rkey: $rkey, posted_by: $posted_by) {
      _key
      posting {
        id
        adjusted_gross_score
        differential
        date_validated
        exceptional
        posted_by
        estimated_handicap
        success
        messages
      }
    }
  }
`;
