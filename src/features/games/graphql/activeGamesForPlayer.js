import gql from 'graphql-tag';

export default gql`
  query ActiveGamesForPlayer($pkey: String!) {
    activeGamesForPlayer(pkey: $pkey) { _key name start end gametype }
  }
`;
