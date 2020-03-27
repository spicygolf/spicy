import gql from 'graphql-tag';

export default gql`
  query GameSpecsForPlayer($pkey: String!) {
    gameSpecsForPlayer(pkey: $pkey) {
      _key
      name
      status
      type
      max_players
      min_players
      location_type
      team_size
    }
  }
`;
