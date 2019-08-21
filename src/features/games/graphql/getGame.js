import gql from 'graphql-tag';

export default gql`
  query GetGame($game: String!) {
    getGame(_key: $game) {
      _key
      name
      start
      end
      gametype
      tees {
        name
      }
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
      }
      players {
        _key
        name
        short
      }
    }
  }
`;
