import { gql } from '@apollo/client';

// don't put _key in here, or cache will be updated without critical data/fields
export const SCORE_POSTED_SUBSCRIPTION = gql`
  subscription onScorePosted($rkey: String!) {
    scorePosted(rkey: $rkey) {
      _key
      scores {
        hole
        values {
          k
          v
          ts
        }
      }
    }
  }
`;
