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
        rating { all18 }
        slope { all18 }
        holes { hole seq length par handicap }
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
        player {
          _key
          name
        }
      }
      players {
        _key
        name
        short
        team
      }
    }
  }
`;
