import { gql } from '@apollo/client';

export const POST_ROUND_MUTATION = gql`
  mutation PostRoundToHandicapService($rkey: String!, $posted_by_pkey: String!) {
    postRoundToHandicapService(rkey: $rkey, posted_by_pkey: $posted_by_pkey) {
      success
      messages
      posting {
        id
        adjusted_gross_score
        differential
        date_validated
        exceptional
        posted_by_pkey
      }
    }
  }
`;
