import { gql } from '@apollo/client';

// should be client/cache only
export const ROUND_POSTING_FRAGMENT = gql`
  fragment roundPosting on Round {
    _key
    posting {
      id
      adjusted_gross_score
      differential
      date_validated
      exceptional
      posted_by_pkey
    }
  }
`;
