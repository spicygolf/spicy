import gql from 'graphql-tag';

export default gql`
  query GetGame($game: String!) {
    getGame(_key: $game) {
      rounds {
        _key
        date
        seq
        scores {
          hole
          values {
            k v ts
          }
        }
        player {
          _key
          name
          short
        }
      }
    }
  }
`;
