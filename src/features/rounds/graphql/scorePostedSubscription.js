import { gql } from '@apollo/client';

export const SCORE_POSTED_SUBSCRIPTION = gql`
  subscription onScorePosted($rkey: String!) {
    scorePosted(rkey: $rkey) {
      hole
      values {
        k
        v
        ts
      }
    }
  }
`;
