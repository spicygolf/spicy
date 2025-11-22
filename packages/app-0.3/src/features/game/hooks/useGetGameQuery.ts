import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client';

export const query = gql`
  query getGame($gkey: String!) {
    getGame(_key: $gkey) {
      _key
      name
      start
      end
      scope {
        holes
        teams_rotate
        wolf_order
      }
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
          value
        }
      }
      rounds {
        _key
        date
        seq
        handicap_index
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
          estimated_handicap
          posted_by
          success
          messages
        }
        player {
          _key
          name
          handicap {
            source
            id
            gender
            active
            index
            revDate
          }
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
          course {
            course_id
            course_status
            course_name
            course_number
            course_city
            course_state
          }
          course_handicap
          game_handicap
        }
      }
      players {
        _key
        name
        short
        handicap {
          index
          revDate
          gender
        }
      }
      gamespecs {
        _key
        name
        disp
        type
        short_description
        long_description
        better
        min_players
        max_players
        location_type
        teams
        team_size
        team_determination
        wolf_disp
        team_change_every
        scoring {
          hole {
            name
            disp
            seq
            points
            source
            scope
            calculation
            better
            type
            based_on
          }
        }
        options {
          name
          disp
          seq
          type
          sub_type
          choices {
            name
            disp
          }
          default
          value
          limit
          scope
          icon
          show_in
          score_to_par
          based_on
          calculation
          availability
          logic
          better
          after
          input_value
          override
          values {
            value
            holes
          }
        }
        junk {
          name
          disp
          seq
          type
          sub_type
          value
          limit
          scope
          icon
          show_in
          score_to_par
          based_on
          calculation
          availability
          logic
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
          override
        }
      }
      options {
        name
        values {
          value
          holes
        }
      }
    }
  }
`;

export const useGetGameQuery = (options: object) => {
  return useQuery(query, options);
};
