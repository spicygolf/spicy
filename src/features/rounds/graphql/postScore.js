import gql from 'graphql-tag';

export default gql`
  mutation PostScore($round: String!, $score: HoleInput!) {
    postScore(round: $round, score: $score) {
      _key
    }
  }
`;
