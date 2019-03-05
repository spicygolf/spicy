import gql from 'graphql-tag';

export default gql`
  query GetGameSpec($gamespec: String!) {
    getGameSpec(_key: $gamespec) {
      _key name type max_players min_players location_type team_size
    }
  }
`;
