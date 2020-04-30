import { gql } from '@apollo/client';

export const POST_SCORE_MUTATION = gql`
  mutation PostScore($rkey: String!, $score: ScoreInput!) {
    postScore(rkey: $rkey, score: $score) {
      hole
      values {
        k
        v
        ts
      }
    }
  }
`;
