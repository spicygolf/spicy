import { gql } from '@apollo/client';

export default gql`
  mutation PostScore($round: String!, $score: ScoreInput!) {
    postScore(round: $round, score: $score) {
      hole
      values {
        k
        v
        ts
      }
    }
  }
`;
