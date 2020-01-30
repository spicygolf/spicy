import gql from 'graphql-tag';

export default gql`
  query GetGame($gkey: String!) {
    getGame(_key: $gkey) {
      _key
      name
      start
      end
      gametype
      rounds {
        _key
        date
        seq
        game_handicap
        course_handicap
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
        tee {
          _key
          name
          assigned
          course {
            name
          }
          holes {
            hole
            length
            par
            handicap
            seq
          }
        }
      }
      players {
        _key
        name
        short
        team
        handicap {
          value
          revDate
          display
          tournamentScoreCount
        }
      }
    }
  }
`;
