import gql from 'graphql-tag';

export default gql`
  query GetRound($round: String!) {
    getRound(_key: $round) {
      date
      seq
      scores {
        hole
        values {
          k v ts
        }
      }
    }
  }
`;
