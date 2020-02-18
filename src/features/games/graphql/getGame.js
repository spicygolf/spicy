import gql from 'graphql-tag';

import { useQuery } from '@apollo/react-hooks';



export const GET_GAME_QUERY = gql`
  query GetGame($gkey: String!) {
    getGame(_key: $gkey) {
      _key
      name
      start
      end
      gametype
      holes
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
          pops
        }
        player {
          _key
          name
        }
        tee {
          _key
          name
          gender
          rating {
            front9
            back9
            all18
          }
          slope {
            front9
            back9
            all18
          }
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
