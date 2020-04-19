import { gql } from '@apollo/client';

export const GET_GAME_QUERY = gql`
  query GetGame($gkey: String!) {
    getGame(_key: $gkey) {
      _key
      name
      start
      end
      holes
      teams {
        rotate
        holes {
          hole
          teams {
            team
            players
            junk {
              name
              player
              value
            }
          }
          multipliers {
            name
            team
            first_hole
          }
        }
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
        }
        player {
          _key
          name
          handicap {
            index
            revDate
          }
        }
        tee {
          _key
          name
          gender
          Ratings {
            RatingType
            CourseRating
            SlopeRating
            BogeyRating
          }
          assigned
          course {
            _key
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
        handicap {
          index
          revDate
        }
      }
      gamespecs {
        _key
        name
        disp
        type
        min_players
        max_players
        location_type
        team_size
        team_determination
        team_change_every
        scoring {
            hole {
                name
                points
                source
                type
                scope
                based_on
            }
        }
        junk {
            name
            seq
            type
            value
            limit
            scope
            icon
            show_in
            score_to_par
            based_on
            calculation
            better
        }
        multipliers {
            name
            disp
            seq
            value
            icon
            based_on
            scope
            availability
            after
        }
        options {
            name
            disp
            type
            choices {
              name
              disp
            }
            default
        }
      }
      options {
        name
        disp
        type
        value
      }
    }
  }
`;
