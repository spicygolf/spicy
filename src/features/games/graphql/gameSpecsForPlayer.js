import { gql } from '@apollo/client';

export default gql`
  query GameSpecsForPlayer($pkey: String!) {
    gameSpecsForPlayer(pkey: $pkey) {
      gamespec {
        _key
        name
        disp
        status
        type
        max_players
        min_players
        location_type
        teams
        individual
        team_size
        team_determination
        team_change_every
      }
      player_count
    }
  }
`;
