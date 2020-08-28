import { gql } from '@apollo/client';

// should be client/cache only
export const GAME_ROUND_POSTING_FRAGMENT = gql`
  fragment gameRoundPosting on Round {
    _key
    rounds {
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
  }
`;
