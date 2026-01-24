import { gql } from "@apollo/client";

export const GAMES_FOR_PLAYER_FEED = gql`
  query GamesForPlayerFeed(
    $begDate: String!
    $endDate: String!
    $stat: String!
    $currentPlayer: String!
    $myClubs: [String]!
  ) {
    gamesForPlayerFeed(
      begDate: $begDate
      endDate: $endDate
      stat: $stat
      currentPlayer: $currentPlayer
      myClubs: $myClubs
    ) {
      _key
      name
      start
      end
      scope {
        holes
        teams_rotate
        wolf_order
      }
      rounds {
        _key
        date
        seq
        handicap_index
        game_handicap
        course_handicap
        scores {
          hole
          values {
            k
            v
            ts
          }
          pops
          coursePops
        }
        posting {
          id
          adjusted_gross_score
          differential
          date_validated
          exceptional
          posted_by
          success
          messages
        }
        player {
          _key
          name
        }
        tees {
          tee_id
          tee_name
          gender
          ratings {
            rating_type
            course_rating
            slope_rating
            bogey_rating
          }
          holes {
            number
            hole_id
            length
            par
            allocation
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
