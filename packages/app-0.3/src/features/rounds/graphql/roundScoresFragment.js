import { gql } from "@apollo/client";

// should be client/cache only
export const ROUND_SCORES_FRAGMENT = gql`
  fragment myRound on Round {
    _key
    scores {
      hole
      values {
        k
        v
        ts
      }
      pops
    }
  }
`;
