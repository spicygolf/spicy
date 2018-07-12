import gql from 'graphql-tag';

export default gql`
  fragment PostScoreFragment on Round ($round: String!) {
    postScoreFragment(_key: $round) {
      scores {
        hole
        values {
          k v ts
        }
      }
    }
  }
`;
